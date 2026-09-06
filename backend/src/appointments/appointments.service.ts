import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  AppointmentFilters,
  AppointmentsRepository,
} from './appointments.repository';

function toJsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        toJsonSafe(nestedValue),
      ]),
    );
  }

  return value;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async create(
    payload: CreateAppointmentDto,
  ): Promise<Record<string, unknown>> {
    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be less than endAt.');
    }

    const date = startAt.toISOString().slice(0, 10).replaceAll('-', '');
    const code = `APT-${date}-${randomBytes(2).toString('hex').toUpperCase()}`;
    const appointment = await this.appointmentsRepository.reserveAppointment(
      code,
      payload,
    );

    return toJsonSafe(appointment) as Record<string, unknown>;
  }

  async update(
    id: number,
    payload: UpdateAppointmentDto,
  ): Promise<Record<string, unknown>> {
    const appointment = await this.appointmentsRepository.updateAppointment(
      id,
      payload,
    );

    return toJsonSafe(appointment) as Record<string, unknown>;
  }

  async cancel(idOrCode: string): Promise<Record<string, unknown>> {
    const appointment =
      await this.appointmentsRepository.cancelAppointment(idOrCode);

    return toJsonSafe(appointment) as Record<string, unknown>;
  }

  async findByPatientNationalId(
    nationalId: string,
  ): Promise<Record<string, unknown>[]> {
    const appointments =
      await this.appointmentsRepository.findByPatientNationalId(nationalId);

    return toJsonSafe(appointments) as Record<string, unknown>[];
  }

  async findAll(query: QueryAppointmentsDto) {
    if (
      query.start_date &&
      query.end_date &&
      new Date(query.start_date) > new Date(query.end_date)
    ) {
      throw new BadRequestException('start_date must not be after end_date.');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filters: AppointmentFilters = {
      doctorId: query.doctor_id ? BigInt(query.doctor_id) : undefined,
      medicalCenterId: query.medical_center_id
        ? BigInt(query.medical_center_id)
        : undefined,
      patientId: query.patient_id ? BigInt(query.patient_id) : undefined,
      status: query.status,
      appointmentDate: query.appointment_date,
      startDate: query.start_date,
      endDate: query.end_date,
    };

    const [appointments, total] = await Promise.all([
      this.appointmentsRepository.findMany(
        filters,
        (page - 1) * limit,
        limit,
      ),
      this.appointmentsRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      toJsonSafe(appointments) as Record<string, unknown>[],
      total,
      page,
      limit,
    );
  }
}
