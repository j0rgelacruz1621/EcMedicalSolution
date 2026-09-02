import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedules.dto.js';
import { DoctorsRepository } from './doctors.repository';

@Injectable()
export class DoctorsService {
  constructor(private readonly doctorsRepository: DoctorsRepository) {}

  private toJsonSafe<T>(value: T): T {
    const normalized = this.normalizeTimes(value);
    return JSON.parse(
      JSON.stringify(normalized, (_, currentValue) =>
        typeof currentValue === 'bigint' ? Number(currentValue) : currentValue,
      ),
    ) as T;
  }

  private normalizeTimes<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeTimes(item)) as T;
    }

    if (value instanceof Date) {
      return this.formatTime(value) as T;
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if ((key === 'startTime' || key === 'endTime') && (item instanceof Date || typeof item === 'string')) {
          return [key, this.formatTimeFromSource(item)];
        }

        return [key, this.normalizeTimes(item)];
      });

      return Object.fromEntries(entries) as T;
    }

    return value;
  }

  private formatTime(value: Date): string {
    const hours = value.getUTCHours().toString().padStart(2, '0');
    const minutes = value.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private formatTimeFromSource(value: Date | string): string {
    if (value instanceof Date) {
      return this.formatTime(value);
    }

    if (typeof value === 'string') {
      const [hours, minutes] = value.split(':').map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return this.formatTime(parsed);
      }
    }

    return value;
  }

  private toDbTime(value: string): Date {
    const [hours, minutes] = value.split(':').map(Number);
    return new Date(`1970-01-01T${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:00Z`);
  }

  async findAll(page = 1, limit = 10) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const skip = (safePage - 1) * safeLimit;

    const [doctors, total] = await Promise.all([
      this.doctorsRepository.findManyWithSchedules(skip, safeLimit),
      this.doctorsRepository.countDoctors(),
    ]);

    return new PaginatedResponseDto(
      this.toJsonSafe(doctors),
      total,
      safePage,
      safeLimit,
    );
  }

  async findOne(id: number) {
    const doctor = await this.doctorsRepository.findDoctorByIdWithSchedules(BigInt(id));

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    return this.toJsonSafe(doctor);
  }

  async create(payload: CreateDoctorDto) {
    const existingDoctor = await this.doctorsRepository.findDoctorByUniqueFields(
      payload.licenseNumber,
      payload.nationalId,
      payload.email,
    );

    if (existingDoctor) {
      throw new ConflictException('Doctor already exists.');
    }

    if (payload.officeId !== undefined) {
      const existingOffice = await this.doctorsRepository.findOfficeById(payload.officeId);

      if (!Array.isArray(existingOffice) || existingOffice.length === 0) {
        throw new BadRequestException('The provided officeId does not exist.');
      }
    }

    try {
      const doctor = await this.doctorsRepository.createDoctor(payload);

      return this.toJsonSafe(doctor);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2003' &&
        typeof error === 'object' &&
        error !== null &&
        'meta' in error &&
        typeof (error as { meta?: { constraint?: string } }).meta?.constraint === 'string' &&
        (error as { meta?: { constraint?: string } }).meta?.constraint === 'fk_doctors_office'
      ) {
        throw new BadRequestException('The provided officeId does not exist.');
      }

      throw error;
    }
  }

  async createSchedules(doctorId: number, payload: CreateDoctorSchedulesDto) {
    const doctor = await this.doctorsRepository.findDoctorById(BigInt(doctorId));

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    const existingSchedules = await this.doctorsRepository.findSchedulesByDoctorId(BigInt(doctorId));

    const normalizedSchedules = payload.schedules.map((schedule) => ({
      doctorId: BigInt(doctorId),
      dayOfWeek: schedule.dayOfWeek.toUpperCase(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));

    for (const schedule of normalizedSchedules) {
      if (schedule.startTime >= schedule.endTime) {
        throw new BadRequestException('startTime must be less than endTime.');
      }

      const overlapWithExisting = existingSchedules.some(
        (existing: { dayOfWeek: string; startTime: Date | string; endTime: Date | string }) => {
          if (existing.dayOfWeek?.toUpperCase() !== schedule.dayOfWeek) {
            return false;
          }

          const existingStart =
            existing.startTime instanceof Date ? existing.startTime : this.toDbTime(existing.startTime as string);
          const existingEnd =
            existing.endTime instanceof Date ? existing.endTime : this.toDbTime(existing.endTime as string);

          return (
            this.toDbTime(schedule.startTime).getTime() < existingEnd.getTime() &&
            this.toDbTime(schedule.endTime).getTime() > existingStart.getTime()
          );
        },
      );

      if (overlapWithExisting) {
        throw new BadRequestException('Schedule overlaps with an existing slot.');
      }

      const overlapWithinPayload = normalizedSchedules.some((candidate) => {
        if (candidate === schedule) {
          return false;
        }

        if (candidate.dayOfWeek !== schedule.dayOfWeek) {
          return false;
        }

        return (
          schedule.startTime < candidate.endTime &&
          schedule.endTime > candidate.startTime
        );
      });

      if (overlapWithinPayload) {
        throw new BadRequestException('Schedule overlaps with another slot in the payload.');
      }
    }

    const schedules = await this.doctorsRepository.createSchedules(
      normalizedSchedules.map((schedule) => ({
        doctorId: schedule.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: this.toDbTime(schedule.startTime),
        endTime: this.toDbTime(schedule.endTime),
      })),
    );

    return this.toJsonSafe(schedules);
  }
}
