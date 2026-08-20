import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePatientVitalsDto } from './dto/create-patient-vitals.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { QueryVitalsDto } from './dto/query-vitals.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  GENDER_MAP,
  PatientData,
  PatientsRepository,
  VitalsInput,
} from './patients.repository';

function toJsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
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

const BLOOD_PRESSURE_PATTERN = /^(\d{2,3})\/(\d{2,3})$/;

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  private parseBloodPressure(bloodPressure?: string): {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
  } {
    if (!bloodPressure) {
      return {};
    }

    const match = bloodPressure.match(BLOOD_PRESSURE_PATTERN);

    if (!match) {
      throw new BadRequestException(
        'bloodPressure must have the format "systolic/diastolic", e.g. "120/80".',
      );
    }

    return {
      bloodPressureSystolic: Number(match[1]),
      bloodPressureDiastolic: Number(match[2]),
    };
  }

  private parseVitals(payload: CreatePatientVitalsDto): VitalsInput {
    return {
      ...this.parseBloodPressure(payload.bloodPressure),
      heartRateBpm: payload.heartRateBpm,
      weightKg: payload.weightKg,
      measuredAt: payload.measuredAt ? new Date(payload.measuredAt) : undefined,
    };
  }

  async create(payload: CreatePatientDto) {
    const existingPatient = await this.patientsRepository.findByNationalId(
      payload.nationalId,
    );

    if (existingPatient) {
      throw new ConflictException(
        `A patient with national ID "${payload.nationalId}" already exists.`,
      );
    }

    const vitals = this.parseVitals(payload.vitals);

    try {
      const result = await this.patientsRepository.createPatientWithVitals(
        {
          nationalId: payload.nationalId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          dateOfBirth: new Date(payload.dateOfBirth),
          gender: GENDER_MAP[payload.gender],
          medicalHistoryNotes: payload.medicalHistoryNotes,
        },
        vitals,
      );

      return toJsonSafe(result);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A patient with national ID "${payload.nationalId}" already exists.`,
        );
      }

      throw error;
    }
  }

  async findAll(query: QueryPatientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filters = {
      nationalId: query.nationalId,
      firstName: query.firstName,
      lastName: query.lastName,
    };

    const [patients, total] = await Promise.all([
      this.patientsRepository.findMany(filters, (page - 1) * limit, limit),
      this.patientsRepository.count(filters),
    ]);

    const latestVitals =
      await this.patientsRepository.findLatestVitalsForPatients(
        patients.map((patient) => patient.id),
      );
    const latestVitalsByPatientId = new Map(
      latestVitals.map((record) => [record.patient_id.toString(), record]),
    );

    const data = patients.map((patient) => ({
      ...patient,
      latestVitals: latestVitalsByPatientId.get(patient.id.toString()) ?? null,
    }));

    return {
      data: toJsonSafe(data),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findVitalsHistory(id: number, query: QueryVitalsDto) {
    const patient = await this.patientsRepository.findById(BigInt(id));

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [vitals, total] = await Promise.all([
      this.patientsRepository.findVitalsHistory(
        BigInt(id),
        (page - 1) * limit,
        limit,
      ),
      this.patientsRepository.countVitals(BigInt(id)),
    ]);

    return {
      data: toJsonSafe(vitals),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async update(id: number, payload: UpdatePatientDto) {
    const patient = await this.patientsRepository.findById(BigInt(id));

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const patientData: Partial<PatientData> = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined,
      gender: payload.gender ? GENDER_MAP[payload.gender] : undefined,
      medicalHistoryNotes: payload.medicalHistoryNotes,
    };

    if (payload.vitals) {
      const vitals = this.parseVitals(payload.vitals);
      const result = await this.patientsRepository.updatePatientWithVitals(
        BigInt(id),
        patientData,
        vitals,
      );

      return toJsonSafe(result);
    }

    const updatedPatient = await this.patientsRepository.updatePatientOnly(
      BigInt(id),
      patientData,
    );
    const latestVitals = await this.patientsRepository.findLatestVitals(
      BigInt(id),
    );

    return toJsonSafe({ patient: updatedPatient, vitals: latestVitals });
  }
}
