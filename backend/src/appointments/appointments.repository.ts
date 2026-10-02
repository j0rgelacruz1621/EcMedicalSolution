import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { appointment_status_enum, gender_enum, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAppointmentDto,
  PatientGender,
} from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const GENDER_MAP: Record<PatientGender, gender_enum> = {
  [PatientGender.MASCULINO]: 'Male',
  [PatientGender.FEMENINO]: 'Female',
  [PatientGender.OTRO]: 'Other',
};

const NON_CANCELABLE_STATUSES: appointment_status_enum[] = [
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export interface AppointmentFilters {
  doctorId?: bigint;
  medicalCenterId?: bigint;
  patientId?: bigint;
  guestNationalId?: string;
  status?: appointment_status_enum;
  appointmentDate?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reserveAppointment(code: string, payload: CreateAppointmentDto) {
    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);
    const appointmentDate = new Date(
      Date.UTC(
        startAt.getUTCFullYear(),
        startAt.getUTCMonth(),
        startAt.getUTCDate(),
      ),
    );
    const startTime = new Date(
      Date.UTC(
        1970,
        0,
        1,
        startAt.getUTCHours(),
        startAt.getUTCMinutes(),
        startAt.getUTCSeconds(),
      ),
    );
    const endTime = new Date(
      Date.UTC(
        1970,
        0,
        1,
        endAt.getUTCHours(),
        endAt.getUTCMinutes(),
        endAt.getUTCSeconds(),
      ),
    );
    const appointmentDateValue = startAt.toISOString().slice(0, 10);
    const startTimeValue = startAt.toISOString().slice(11, 19);
    const endTimeValue = endAt.toISOString().slice(11, 19);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const lockKey = `appointment:${payload.doctorId}:${appointmentDateValue}`;
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

        const doctor = await transaction.doctor.findUnique({
          where: { id: BigInt(payload.doctorId) },
          select: { id: true },
        });

        if (!doctor) {
          throw new NotFoundException('Doctor not found.');
        }

        const overlappingAppointment = await transaction.$queryRaw<
          [{ id: bigint }]
        >`
          SELECT id
          FROM appointments
          WHERE doctor_id = ${doctor.id}
            AND office_id = CAST(${payload.officeId} AS bigint)
            AND appointment_date = CAST(${appointmentDateValue} AS date)
            AND status IN ('SCHEDULED', 'CONFIRMED')
            AND start_time < CAST(${endTimeValue} AS time)
            AND end_time > CAST(${startTimeValue} AS time)
          LIMIT 1
        `;

        if (overlappingAppointment.length > 0) {
          throw new ConflictException(
            'The selected appointment time is no longer available.',
          );
        }

        // El consultorio no puede estar ocupado por otro médico a esa hora
        const officeBusy = await transaction.$queryRaw<
          [{ id: bigint }]
        >`
          SELECT id
          FROM appointments
          WHERE office_id = CAST(${payload.officeId} AS bigint)
            AND appointment_date = CAST(${appointmentDateValue} AS date)
            AND status IN ('SCHEDULED', 'CONFIRMED')
            AND start_time < CAST(${endTimeValue} AS time)
            AND end_time > CAST(${startTimeValue} AS time)
          LIMIT 1
        `;

        if (officeBusy.length > 0) {
          throw new ConflictException(
            'The selected office is already booked at that time.',
          );
        }

        // Separación de procesos: agendar una cita NO crea un paciente.
        // Si la cédula ya existe en "patients" se vincula la cita a ese paciente;
        // si no existe, la cita guarda los datos del solicitante como invitado (guest)
        // y la conversión a paciente ocurre solo en el módulo de pacientes.
        const existingPatient = await transaction.patient.findUnique({
          where: { nationalId: payload.patient.nationalId },
          select: { id: true },
        });

        return transaction.appointment.create({
          data: {
            appointmentCode: code,
            doctorId: doctor.id,
            patientId: existingPatient?.id ?? null,
            ...(!existingPatient && {
              guestNationalId: payload.patient.nationalId,
              guestFirstName: payload.patient.firstName,
              guestLastName: payload.patient.lastName,
              guestEmail:
                payload.patient.email ||
                `${payload.patient.nationalId}@pending.local`,
              guestPhone: payload.patient.phone,
              guestAge: payload.patient.age ?? 0,
              guestGender: GENDER_MAP[payload.patient.gender],
            }),
            appointmentDate,
            startTime,
            endTime,
            medicalCenterId: payload.medicalCenterId,
            officeId: payload.officeId,
            reasonForVisit: payload.reasonForVisit,
            type: payload.type,
            status: 'SCHEDULED',
          },
          include: { patient: true },
        });
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2010'
      ) {
        const databaseCode = (error.meta as { code?: string } | undefined)
          ?.code;
        if (databaseCode === '23P01') {
          throw new ConflictException(
            'The selected appointment time is no longer available.',
          );
        }
      }

      throw error;
    }
  }

  async updateAppointment(id: number, payload: UpdateAppointmentDto) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.appointment.findUnique({
        where: { id: BigInt(id) },
      });

      if (!current) {
        throw new NotFoundException('Appointment not found.');
      }

      const appointmentDateValue =
        payload.appointment_date ??
        current.appointmentDate.toISOString().slice(0, 10);
      const startTimeValue =
        payload.start_time ?? current.startTime.toISOString().slice(11, 19);
      const endTimeValue =
        payload.end_time ?? current.endTime.toISOString().slice(11, 19);
      const officeId =
        payload.office_id !== undefined
          ? BigInt(payload.office_id)
          : current.officeId;
      const status = payload.status ?? current.status;

      if (endTimeValue <= startTimeValue) {
        throw new BadRequestException(
          'end_time must be greater than start_time.',
        );
      }

      const lockKey = `appointment:${current.doctorId}:${appointmentDateValue}`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

      const doctorOverlap = await transaction.$queryRaw<[{ id: bigint }]>`
        SELECT id
        FROM appointments
        WHERE doctor_id = ${current.doctorId}
          AND office_id = ${officeId ?? current.officeId}
          AND id <> ${current.id}
          AND appointment_date = CAST(${appointmentDateValue} AS date)
          AND status IN ('SCHEDULED', 'CONFIRMED')
          AND start_time < CAST(${endTimeValue} AS time)
          AND end_time > CAST(${startTimeValue} AS time)
        LIMIT 1
      `;

      if (doctorOverlap.length > 0) {
        throw new ConflictException(
          'The doctor already has another appointment overlapping this schedule in the selected office.',
        );
      }

      if (officeId) {
        const officeOverlap = await transaction.$queryRaw<[{ id: bigint }]>`
          SELECT id
          FROM appointments
          WHERE office_id = ${officeId}
            AND id <> ${current.id}
            AND appointment_date = CAST(${appointmentDateValue} AS date)
            AND status IN ('SCHEDULED', 'CONFIRMED')
            AND start_time < CAST(${endTimeValue} AS time)
            AND end_time > CAST(${startTimeValue} AS time)
          LIMIT 1
        `;

        if (officeOverlap.length > 0) {
          throw new ConflictException(
            'The office already has another appointment overlapping this schedule.',
          );
        }
      }

      return transaction.appointment.update({
        where: { id: current.id },
        data: {
          appointmentDate: new Date(`${appointmentDateValue}T00:00:00.000Z`),
          startTime: new Date(`1970-01-01T${startTimeValue}.000Z`),
          endTime: new Date(`1970-01-01T${endTimeValue}.000Z`),
          officeId,
          status,
          type: payload.type,
        },
        include: {
          patient: true,
        },
      });
    });
  }

  async cancelAppointment(idOrCode: string) {
    const isNumericId = /^\d+$/.test(idOrCode);

    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.appointment.findUnique({
        where: isNumericId
          ? { id: BigInt(idOrCode) }
          : { appointmentCode: idOrCode },
      });

      if (!current) {
        throw new NotFoundException('Appointment not found.');
      }

      if (current.status && NON_CANCELABLE_STATUSES.includes(current.status)) {
        throw new UnprocessableEntityException(
          `Appointment cannot be cancelled because it is already ${current.status}.`,
        );
      }

      return transaction.appointment.update({
        where: { id: current.id },
        data: { status: 'CANCELLED' },
        include: {
          patient: true,
          doctor: true,
          medicalCenter: true,
          office: true,
        },
      });
    });
  }

  private buildWhere(filters: AppointmentFilters): Prisma.AppointmentWhereInput {
    const where: Prisma.AppointmentWhereInput = {
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(filters.medicalCenterId
        ? { medicalCenterId: filters.medicalCenterId }
        : {}),
      ...(filters.patientId ? { patientId: filters.patientId } : {}),
      ...(filters.guestNationalId
        ? { guestNationalId: filters.guestNationalId }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    if (filters.appointmentDate) {
      where.appointmentDate = new Date(filters.appointmentDate);
    } else if (filters.startDate || filters.endDate) {
      where.appointmentDate = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    return where;
  }

  findMany(filters: AppointmentFilters, skip: number, take: number) {
    return this.prisma.appointment.findMany({
      where: this.buildWhere(filters),
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
      skip,
      take,
      include: {
        patient: true,
      },
    });
  }

  count(filters: AppointmentFilters) {
    return this.prisma.appointment.count({ where: this.buildWhere(filters) });
  }
  async findByPatientNationalId(nationalId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { nationalId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
      include: {
        patient: true,
      },
    });
  }
}
