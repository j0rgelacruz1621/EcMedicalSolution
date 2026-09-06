import { Injectable } from '@nestjs/common';
import { CreateMedicalCenterDto } from './dto/create-medical-center.dto';
import { CreateOfficeDto } from './dto/create-office.dto';
import { MedicalCentersRepository } from './medical-centers.repository';

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
export class MedicalCentersService {
  constructor(private readonly repository: MedicalCentersRepository) {}

  async findMedicalCenters() {
    return toJsonSafe(await this.repository.findMedicalCenters());
  }

  async findOffices() {
    return toJsonSafe(await this.repository.findOffices());
  }

  async createMedicalCenter(
    payload: CreateMedicalCenterDto,
  ): Promise<Record<string, unknown>> {
    const medicalCenter = await this.repository.createMedicalCenter(payload);
    return toJsonSafe(medicalCenter) as Record<string, unknown>;
  }

  async createOffice(
    payload: CreateOfficeDto,
  ): Promise<Record<string, unknown>> {
    const office = await this.repository.createOffice(payload);
    return toJsonSafe(office) as Record<string, unknown>;
  }
}
