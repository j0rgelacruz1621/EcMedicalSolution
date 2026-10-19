import { Injectable } from '@nestjs/common';
import {
  medical_report_status_enum,
  medical_report_type_enum,
  Prisma,
} from '@prisma/client';
import {
  documentDoctorSelect,
  documentMedicalCenterSelect,
  documentPatientSelect,
} from '../common/documents/printable-document';
import { PrismaService } from '../prisma/prisma.service';

export const medicalReportInclude = {
  patient: { select: documentPatientSelect },
  doctor: { select: documentDoctorSelect },
  medicalCenter: { select: documentMedicalCenterSelect },
} satisfies Prisma.MedicalReportInclude;

export type MedicalReportWithRelations = Prisma.MedicalReportGetPayload<{
  include: typeof medicalReportInclude;
}>;

export interface MedicalReportFilters {
  patientId: bigint;
  type?: medical_report_type_enum;
  issuedFrom?: Date;
  issuedTo?: Date;
}

// Estados en los que el informe todavía puede modificarse o firmarse.
export const OPEN_STATUSES: medical_report_status_enum[] = ['ACTIVE', 'EDITED'];

@Injectable()
export class MedicalReportsRepository {
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
      select: {
        id: true,
        headerImageUrl: true,
        office: { select: { medicalCenterId: true } },
      },
    });
  }

  findMedicalCenterById(id: bigint) {
    return this.prisma.medicalCenter.findUnique({
      where: { id },
      select: { id: true, headerImageUrl: true },
    });
  }

  findAppointmentById(id: bigint) {
    return this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true, patientId: true },
    });
  }

  create(data: Prisma.MedicalReportUncheckedCreateInput) {
    return this.prisma.medicalReport.create({
      data,
      include: medicalReportInclude,
    });
  }

  findById(id: bigint) {
    return this.prisma.medicalReport.findUnique({
      where: { id },
      include: medicalReportInclude,
    });
  }

  private buildWhere(
    filters: MedicalReportFilters,
  ): Prisma.MedicalReportWhereInput {
    return {
      patientId: filters.patientId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.issuedFrom || filters.issuedTo
        ? {
            issueDate: {
              ...(filters.issuedFrom ? { gte: filters.issuedFrom } : {}),
              ...(filters.issuedTo ? { lte: filters.issuedTo } : {}),
            },
          }
        : {}),
    };
  }

  findMany(filters: MedicalReportFilters, skip: number, take: number) {
    return this.prisma.medicalReport.findMany({
      where: this.buildWhere(filters),
      include: medicalReportInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    });
  }

  count(filters: MedicalReportFilters) {
    return this.prisma.medicalReport.count({
      where: this.buildWhere(filters),
    });
  }

  // Actualiza solo si el informe sigue en uno de los estados esperados; así una
  // firma o anulación simultánea no se pisa con una edición. Devuelve null si no
  // se actualizó nada.
  async updateIfStatusIn(
    id: bigint,
    expectedStatuses: medical_report_status_enum[],
    data: Prisma.MedicalReportUncheckedUpdateInput,
  ) {
    const { count } = await this.prisma.medicalReport.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data,
    });

    return count === 0 ? null : this.findById(id);
  }
}
