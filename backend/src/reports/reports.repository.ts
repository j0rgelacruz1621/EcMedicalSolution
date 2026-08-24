import { Injectable } from '@nestjs/common';
import { Prisma, report_status_enum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

interface ReportFilters {
  patient_id?: bigint;
  doctor_id?: bigint;
  status?: report_status_enum;
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPatientById(id: bigint) {
    return this.prisma.patient.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findDoctorById(id: bigint) {
    return this.prisma.doctor.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findAppointmentById(id: bigint) {
    return this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  createReport(payload: CreateReportDto) {
    return this.prisma.reports.create({
      data: {
        patient_id: BigInt(payload.patient_id),
        doctor_id: BigInt(payload.doctor_id),
        appointment_id: payload.appointment_id
          ? BigInt(payload.appointment_id)
          : undefined,
        title: payload.title,
        content: payload.content,
      },
    });
  }

  private buildWhere(filters: ReportFilters): Prisma.reportsWhereInput {
    return {
      ...(filters.patient_id ? { patient_id: filters.patient_id } : {}),
      ...(filters.doctor_id ? { doctor_id: filters.doctor_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
  }

  findMany(filters: ReportFilters, skip: number, take: number) {
    return this.prisma.reports.findMany({
      where: this.buildWhere(filters),
      orderBy: { created_at: 'desc' },
      skip,
      take,
    });
  }

  count(filters: ReportFilters) {
    return this.prisma.reports.count({ where: this.buildWhere(filters) });
  }

  findById(id: bigint) {
    return this.prisma.reports.findUnique({ where: { id } });
  }

  updateStatus(id: bigint, status: report_status_enum) {
    return this.prisma.reports.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }

  attachFile(id: bigint, fileUrl: string) {
    return this.prisma.reports.update({
      where: { id },
      data: { file_url: fileUrl, updated_at: new Date() },
    });
  }

  countPendingByDoctor(doctorId: bigint) {
    return this.prisma.reports.count({
      where: { doctor_id: doctorId, status: 'PENDING_REVIEW' },
    });
  }
}
