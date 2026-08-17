import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentScheduleDto } from './dto/create-appointment.dto';

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
            AND appointment_date = CAST(${appointmentDateValue} AS date)
            AND status IN ('RESERVED', 'CONFIRMED')
            AND start_time < CAST(${endTimeValue} AS time)
            AND end_time > CAST(${startTimeValue} AS time)
          LIMIT 1
        `;

        if (overlappingAppointment.length > 0) {
          throw new ConflictException(
            'The selected appointment time is no longer available.',
          );
        }

        const patient = await transaction.patient.upsert({
          where: { nationalId: payload.patient.nationalId },
          create: {
            nationalId: payload.patient.nationalId,
            firstName: payload.patient.firstName,
            lastName: payload.patient.lastName,
            email: payload.patient.email,
            phone: payload.patient.phone,
            dateOfBirth: new Date(payload.patient.dateOfBirth),
            gender: payload.patient.gender,
            medicalHistoryNotes: payload.patient.medicalHistoryNotes,
          },
          update: {
            firstName: payload.patient.firstName,
            lastName: payload.patient.lastName,
            email: payload.patient.email,
            phone: payload.patient.phone,
          },
        });

        return transaction.appointment.create({
          data: {
            appointmentCode: code,
            doctorId: doctor.id,
            patientId: patient.id,
            appointmentDate,
            startTime,
            endTime,
            medicalCenterId: payload.medicalCenterId,
            officeId: payload.officeId,
            reasonForVisit: payload.reasonForVisit,
            status: 'RESERVED',
          },
          include: { patient: true, doctor: true },
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

  async updateSchedule(id: number, payload: UpdateAppointmentScheduleDto) {
    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);
    const appointmentDateValue = startAt.toISOString().slice(0, 10);
    const startTimeValue = startAt.toISOString().slice(11, 19);
    const endTimeValue = endAt.toISOString().slice(11, 19);
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

    return this.prisma.$transaction(async (transaction) => {
      const currentAppointment = await transaction.appointment.findUnique({
        where: { id: BigInt(id) },
        select: { id: true, doctorId: true },
      });

      if (!currentAppointment) {
        throw new NotFoundException('Appointment not found.');
      }

      const lockKey = `appointment:${currentAppointment.doctorId}:${appointmentDateValue}`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

      const overlappingAppointment = await transaction.$queryRaw<
        [{ id: bigint }]
      >`
        SELECT id
        FROM appointments
        WHERE doctor_id = ${currentAppointment.doctorId}
          AND id <> ${currentAppointment.id}
          AND appointment_date = CAST(${appointmentDateValue} AS date)
          AND status IN ('RESERVED', 'CONFIRMED')
          AND start_time < CAST(${endTimeValue} AS time)
          AND end_time > CAST(${startTimeValue} AS time)
        LIMIT 1
      `;

      if (overlappingAppointment.length > 0) {
        throw new ConflictException(
          'The selected appointment time is no longer available.',
        );
      }

      return transaction.appointment.update({
        where: { id: currentAppointment.id },
        data: { appointmentDate, startTime, endTime },
        include: { patient: true, doctor: true },
      });
    });
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
        doctor: true,
        medicalCenter: true,
        office: true,
      },
    });
  }
}
