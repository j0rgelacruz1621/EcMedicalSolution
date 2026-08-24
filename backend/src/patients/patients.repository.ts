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
  firstName?: string;
  lastName?: string;
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
  dateOfBirth: Date;
  gender: gender_enum;
  medicalHistoryNotes?: string;
}

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

  findById(id: bigint) {
    return this.prisma.patient.findUnique({ where: { id } });
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

  updatePatientOnly(id: bigint, patientData: Partial<PatientData>) {
    return this.prisma.patient.update({ where: { id }, data: patientData });
  }

  updatePatientWithVitals(
    id: bigint,
    patientData: Partial<PatientData>,
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
    };
  }

  findMany(filters: PatientFilters, skip: number, take: number) {
    return this.prisma.patient.findMany({
      where: this.buildWhere(filters),
      orderBy: { id: 'desc' },
      skip,
      take,
    });
  }

  count(filters: PatientFilters) {
    return this.prisma.patient.count({ where: this.buildWhere(filters) });
  }
}
