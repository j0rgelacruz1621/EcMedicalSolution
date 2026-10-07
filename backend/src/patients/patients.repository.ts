import { Injectable } from '@nestjs/common';
import { Prisma, gender_enum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PatientGender } from './dto/create-patient.dto';

export const GENDER_MAP: Record<PatientGender, gender_enum> = {
  [PatientGender.MASCULINO]: 'Male',
  [PatientGender.FEMENINO]: 'Female',
  [PatientGender.OTRO]: 'Other',
};

export interface PatientFilters {
  nationalId?: string;
  search?: string;
  firstName?: string;
  lastName?: string;
  doctorId?: bigint;
  isActive?: boolean;
}

export interface VitalsInput {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRateBpm?: number;
  weightKg?: number;
  measuredAt?: Date;
}

export interface PatientData {
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
  origin?: string;
  address?: string;
  assignedDoctorId?: bigint;
  gender: gender_enum;
  medicalHistoryNotes?: string;
  isActive?: boolean;
}

/** Igual que PatientData, pero las columnas NULLABLE admiten null para borrar el valor. */
export type PatientUpdateData = Partial<
  Omit<
    PatientData,
    'age' | 'origin' | 'address' | 'assignedDoctorId' | 'medicalHistoryNotes'
  >
> & {
  age?: number | null;
  origin?: string | null;
  address?: string | null;
  assignedDoctorId?: bigint | null;
  medicalHistoryNotes?: string | null;
};

function vitalsCreateData(patientId: bigint, vitals: VitalsInput) {
  return {
    patient_id: patientId,
    blood_pressure_systolic: vitals.bloodPressureSystolic,
    blood_pressure_diastolic: vitals.bloodPressureDiastolic,
    heart_rate_bpm: vitals.heartRateBpm,
    weight_kg: vitals.weightKg,
    measured_at: vitals.measuredAt ?? new Date(),
  };
}

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByNationalId(nationalId: string) {
    return this.prisma.patient.findUnique({ where: { nationalId } });
  }

  findByEmail(email: string, excludeId?: bigint) {
    return this.prisma.patient.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
  }

  findById(id: bigint) {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  findDoctorById(id: bigint) {
    return this.prisma.doctor.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  /**
   * Registers a patient and its initial triage vitals atomically: either both
   * rows (patients + patient_vitals) are committed, or neither is.
   */
  createPatientWithVitals(patientData: PatientData, vitals: VitalsInput) {
    return this.prisma.$transaction(async (transaction) => {
      const patient = await transaction.patient.create({ data: patientData });
      const patientVitals = await transaction.patient_vitals.create({
        data: vitalsCreateData(patient.id, vitals),
      });

      return { patient, vitals: patientVitals };
    });
  }

  createPatientOnly(patientData: PatientData) {
    return this.prisma.patient.create({ data: patientData });
  }

  updatePatientOnly(id: bigint, patientData: PatientUpdateData) {
    return this.prisma.patient.update({ where: { id }, data: patientData });
  }

  updatePatientWithVitals(
    id: bigint,
    patientData: PatientUpdateData,
    vitals: VitalsInput,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const patient = await transaction.patient.update({
        where: { id },
        data: patientData,
      });
      const patientVitals = await transaction.patient_vitals.create({
        data: vitalsCreateData(id, vitals),
      });

      return { patient, vitals: patientVitals };
    });
  }

  findLatestVitals(patientId: bigint) {
    return this.prisma.patient_vitals.findFirst({
      where: { patient_id: patientId },
      orderBy: { measured_at: 'desc' },
    });
  }

  findLatestVitalsForPatients(patientIds: bigint[]) {
    if (patientIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.patient_vitals.findMany({
      where: { patient_id: { in: patientIds } },
      orderBy: { measured_at: 'desc' },
      distinct: ['patient_id'],
    });
  }

  findVitalsHistory(patientId: bigint, skip: number, take: number) {
    return this.prisma.patient_vitals.findMany({
      where: { patient_id: patientId },
      orderBy: { measured_at: 'desc' },
      skip,
      take,
    });
  }

  countVitals(patientId: bigint) {
    return this.prisma.patient_vitals.count({
      where: { patient_id: patientId },
    });
  }

  private buildWhere(filters: PatientFilters): Prisma.PatientWhereInput {
    // Cada palabra de "search" debe aparecer en el nombre o en el apellido,
    // de modo que "juan perez" encuentre a Juan Pérez sin importar el orden.
    const searchTerms = filters.search?.trim().split(/\s+/).filter(Boolean);
    const and: Prisma.PatientWhereInput[] = [
      ...(searchTerms ?? []).map(
        (term): Prisma.PatientWhereInput => ({
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
          ],
        }),
      ),
      ...(filters.doctorId
        ? [
            {
              OR: [
                { assignedDoctorId: filters.doctorId },
                { appointments: { some: { doctorId: filters.doctorId } } },
              ],
            },
          ]
        : []),
    ];

    return {
      ...(filters.nationalId
        ? { nationalId: { contains: filters.nationalId, mode: 'insensitive' } }
        : {}),
      ...(filters.firstName
        ? { firstName: { contains: filters.firstName, mode: 'insensitive' } }
        : {}),
      ...(filters.lastName
        ? { lastName: { contains: filters.lastName, mode: 'insensitive' } }
        : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(and.length > 0 ? { AND: and } : {}),
    };
  }

  findMany(filters: PatientFilters, skip: number, take: number) {
    return this.prisma.patient.findMany({
      where: this.buildWhere(filters),
      // id desempata registros con el mismo created_at para que la paginación sea estable
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    });
  }

  count(filters: PatientFilters) {
    return this.prisma.patient.count({ where: this.buildWhere(filters) });
  }
}
