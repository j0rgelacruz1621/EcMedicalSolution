import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreatePatientVitalsDto } from './dto/create-patient-vitals.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { QueryVitalsDto } from './dto/query-vitals.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  GENDER_MAP,
  PatientData,
  PatientsRepository,
  PatientUpdateData,
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

  private async assertUniqueIdentity(
    identity: { nationalId?: string; email?: string },
    currentId?: bigint,
  ) {
    if (identity.nationalId !== undefined) {
      const existing = await this.patientsRepository.findByNationalId(
        identity.nationalId,
      );

      if (existing && existing.id !== currentId) {
        throw new ConflictException(
          `A patient with national ID "${identity.nationalId}" already exists.`,
        );
      }
    }

    if (identity.email !== undefined) {
      const existing = await this.patientsRepository.findByEmail(
        identity.email,
        currentId,
      );

      if (existing) {
        throw new ConflictException(
          `A patient with email "${identity.email}" already exists.`,
        );
      }
    }
  }

  private async assertDoctorExists(assignedDoctorId?: number | null) {
    if (!assignedDoctorId) {
      return;
    }

    const doctor = await this.patientsRepository.findDoctorById(
      BigInt(assignedDoctorId),
    );

    if (!doctor) {
      throw new BadRequestException(
        `assignedDoctorId "${assignedDoctorId}" does not match an existing doctor.`,
      );
    }
  }

  // Las validaciones previas no cubren dos peticiones simultáneas ni un
  // registro eliminado entre la verificación y la escritura: la BD decide.
  private translateDatabaseError(
    error: unknown,
    payload: {
      nationalId?: string;
      email?: string;
      assignedDoctorId?: number | null;
    },
  ): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          JSON.stringify(error.meta?.target ?? '').includes('email')
            ? `A patient with email "${payload.email}" already exists.`
            : `A patient with national ID "${payload.nationalId}" already exists.`,
        );
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          `assignedDoctorId "${payload.assignedDoctorId}" does not match an existing doctor.`,
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Patient not found.');
      }
    }

    throw error;
  }

  async create(payload: CreatePatientDto) {
    await this.assertUniqueIdentity(payload);
    await this.assertDoctorExists(payload.assignedDoctorId);

    const patientData: PatientData = {
      nationalId: payload.nationalId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      age: payload.age,
      origin: payload.origin,
      address: payload.address,
      assignedDoctorId: payload.assignedDoctorId
        ? BigInt(payload.assignedDoctorId)
        : undefined,
      gender: GENDER_MAP[payload.gender],
      medicalHistoryNotes: payload.medicalHistoryNotes,
      // undefined deja que la BD aplique su DEFAULT true
      isActive: payload.isActive,
    };

    try {
      if (!payload.vitals) {
        const patient =
          await this.patientsRepository.createPatientOnly(patientData);

        return toJsonSafe({ patient, vitals: null });
      }

      const vitals = this.parseVitals(payload.vitals);
      const result = await this.patientsRepository.createPatientWithVitals(
        patientData,
        vitals,
      );

      return toJsonSafe(result);
    } catch (error: unknown) {
      this.translateDatabaseError(error, payload);
    }
  }

  async findAll(query: QueryPatientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filters = {
      nationalId: query.nationalId,
      search: query.search,
      firstName: query.firstName,
      lastName: query.lastName,
      doctorId: query.doctorId ? BigInt(query.doctorId) : undefined,
      isActive: query.isActive,
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

    return new PaginatedResponseDto(
      toJsonSafe(data) as Record<string, unknown>[],
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const patient = await this.patientsRepository.findById(BigInt(id));

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const latestVitals = await this.patientsRepository.findLatestVitals(
      patient.id,
    );

    return toJsonSafe({ ...patient, latestVitals });
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

    return new PaginatedResponseDto(
      toJsonSafe(vitals) as Record<string, unknown>[],
      total,
      page,
      limit,
    );
  }

  /** PATCH: solo se modifican los campos presentes en el payload. */
  update(id: number, payload: UpdatePatientDto) {
    return this.save(id, payload, {
      nationalId: payload.nationalId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      age: payload.age,
      origin: payload.origin,
      address: payload.address,
      assignedDoctorId:
        payload.assignedDoctorId === undefined ||
        payload.assignedDoctorId === null
          ? payload.assignedDoctorId
          : BigInt(payload.assignedDoctorId),
      gender: payload.gender ? GENDER_MAP[payload.gender] : undefined,
      medicalHistoryNotes: payload.medicalHistoryNotes,
      isActive: payload.isActive,
    });
  }

  /**
   * PUT: reemplaza el recurso completo. Los campos opcionales que no se envían
   * vuelven a su valor inicial (NULL, o true en el caso de isActive).
   */
  replace(id: number, payload: CreatePatientDto) {
    return this.save(id, payload, {
      nationalId: payload.nationalId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      age: payload.age ?? null,
      origin: payload.origin ?? null,
      address: payload.address ?? null,
      assignedDoctorId: payload.assignedDoctorId
        ? BigInt(payload.assignedDoctorId)
        : null,
      gender: GENDER_MAP[payload.gender],
      medicalHistoryNotes: payload.medicalHistoryNotes ?? null,
      isActive: payload.isActive ?? true,
    });
  }

  /**
   * Borrado lógico: el paciente queda inactivo y conserva sus citas, signos
   * vitales y reportes. Repetir la operación no vuelve a escribir en la BD.
   */
  async remove(id: number) {
    const patientId = BigInt(id);
    const patient = await this.patientsRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    if (patient.isActive === false) {
      return toJsonSafe(patient);
    }

    try {
      const deactivatedPatient =
        await this.patientsRepository.updatePatientOnly(patientId, {
          isActive: false,
        });

      return toJsonSafe(deactivatedPatient);
    } catch (error: unknown) {
      this.translateDatabaseError(error, {});
    }
  }

  private async save(
    id: number,
    payload: UpdatePatientDto,
    patientData: PatientUpdateData,
  ) {
    const patientId = BigInt(id);
    const patient = await this.patientsRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    await this.assertUniqueIdentity(payload, patientId);
    await this.assertDoctorExists(payload.assignedDoctorId);

    try {
      if (payload.vitals) {
        const vitals = this.parseVitals(payload.vitals);
        const result = await this.patientsRepository.updatePatientWithVitals(
          patientId,
          patientData,
          vitals,
        );

        return toJsonSafe(result);
      }

      const updatedPatient = await this.patientsRepository.updatePatientOnly(
        patientId,
        patientData,
      );
      const latestVitals =
        await this.patientsRepository.findLatestVitals(patientId);

      return toJsonSafe({ patient: updatedPatient, vitals: latestVitals });
    } catch (error: unknown) {
      this.translateDatabaseError(error, payload);
    }
  }
}
