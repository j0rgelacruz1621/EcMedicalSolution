import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { AttachReportFileDto } from './dto/attach-report-file.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsRepository } from './reports.repository';

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
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async create(payload: CreateReportDto) {
    const [patient, doctor, appointment] = await Promise.all([
      this.reportsRepository.findPatientById(BigInt(payload.patient_id)),
      this.reportsRepository.findDoctorById(BigInt(payload.doctor_id)),
      payload.appointment_id
        ? this.reportsRepository.findAppointmentById(
            BigInt(payload.appointment_id),
          )
        : Promise.resolve(true),
    ]);

    if (!patient) {
      throw new BadRequestException('The provided patient_id does not exist.');
    }

    if (!doctor) {
      throw new BadRequestException('The provided doctor_id does not exist.');
    }

    if (!appointment) {
      throw new BadRequestException(
        'The provided appointment_id does not exist.',
      );
    }

    const report = await this.reportsRepository.createReport(payload);
    return toJsonSafe(report);
  }

  async findAll(query: QueryReportsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filters = {
      patient_id: query.patient_id ? BigInt(query.patient_id) : undefined,
      doctor_id: query.doctor_id ? BigInt(query.doctor_id) : undefined,
      status: query.status,
    };

    const [reports, total] = await Promise.all([
      this.reportsRepository.findMany(filters, (page - 1) * limit, limit),
      this.reportsRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      toJsonSafe(reports) as Record<string, unknown>[],
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const report = await this.reportsRepository.findById(BigInt(id));

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    return toJsonSafe(report);
  }

  async updateStatus(id: number, payload: UpdateReportStatusDto) {
    const report = await this.reportsRepository.findById(BigInt(id));

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    const updated = await this.reportsRepository.updateStatus(
      BigInt(id),
      payload.status,
    );

    return toJsonSafe(updated);
  }

  async attachFile(id: number, payload: AttachReportFileDto) {
    const report = await this.reportsRepository.findById(BigInt(id));

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    const updated = await this.reportsRepository.attachFile(
      BigInt(id),
      payload.file_url,
    );

    return toJsonSafe(updated);
  }

  async pendingCountForDoctor(doctorId: number) {
    const doctor = await this.reportsRepository.findDoctorById(
      BigInt(doctorId),
    );

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    const pendingCount = await this.reportsRepository.countPendingByDoctor(
      BigInt(doctorId),
    );

    return { doctorId, pendingCount };
  }
}
