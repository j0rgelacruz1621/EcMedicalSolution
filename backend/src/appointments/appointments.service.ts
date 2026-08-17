import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentScheduleDto } from './dto/create-appointment.dto';
import { AppointmentsRepository } from './appointments.repository';

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

  async updateSchedule(
    id: number,
    payload: UpdateAppointmentScheduleDto,
  ): Promise<Record<string, unknown>> {
    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be less than endAt.');
    }

    const appointment = await this.appointmentsRepository.updateSchedule(
      id,
      payload,
    );

    return toJsonSafe(appointment) as Record<string, unknown>;
  }

  async findByPatientNationalId(
    nationalId: string,
  ): Promise<Record<string, unknown>[]> {
    const appointments =
      await this.appointmentsRepository.findByPatientNationalId(nationalId);

    return toJsonSafe(appointments) as Record<string, unknown>[];
  }
}
