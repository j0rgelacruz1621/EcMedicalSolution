import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';
import { CreatePatientDto, PatientGender } from './dto/create-patient.dto';

describe('PatientsService', () => {
  let service: PatientsService;
  let repository: {
    findByNationalId: jest.Mock;
    findByEmail: jest.Mock;
    createPatientOnly: jest.Mock;
    createPatientWithVitals: jest.Mock;
  };

  const payload: CreatePatientDto = {
    nationalId: '0912345678',
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'maria@example.com',
    phone: '0999999999',
    dateOfBirth: '1990-05-20',
    gender: PatientGender.FEMENINO,
  };

  beforeEach(() => {
    repository = {
      findByNationalId: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      createPatientOnly: jest.fn(),
      createPatientWithVitals: jest.fn(),
    };
    service = new PatientsService(
      repository as unknown as PatientsRepository,
    );
  });

  it('creates a patient without vitals', async () => {
    repository.createPatientOnly.mockResolvedValue({
      id: 1n,
      ...payload,
      isActive: true,
    });

    const result = await service.create(payload);

    expect(repository.createPatientOnly).toHaveBeenCalled();
    expect(repository.createPatientWithVitals).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        patient: expect.objectContaining({ id: 1 }),
        vitals: null,
      }),
    );
  });

  it('creates a patient with vitals when provided', async () => {
    repository.createPatientWithVitals.mockResolvedValue({
      patient: { id: 1n, ...payload },
      vitals: { id: 1n },
    });

    await service.create({
      ...payload,
      vitals: { bloodPressure: '120/80' },
    });

    expect(repository.createPatientWithVitals).toHaveBeenCalled();
    expect(repository.createPatientOnly).not.toHaveBeenCalled();
  });

  it('rejects when the national_id is already registered', async () => {
    repository.findByNationalId.mockResolvedValue({ id: 1n });

    await expect(service.create(payload)).rejects.toThrow(ConflictException);
    expect(repository.createPatientOnly).not.toHaveBeenCalled();
  });

  it('rejects when the email is already registered', async () => {
    repository.findByEmail.mockResolvedValue({ id: 2n });

    await expect(service.create(payload)).rejects.toThrow(ConflictException);
    expect(repository.createPatientOnly).not.toHaveBeenCalled();
  });

  it('translates a unique constraint database error into a ConflictException', async () => {
    repository.createPatientOnly.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      }),
    );

    await expect(service.create(payload)).rejects.toThrow(ConflictException);
  });
});
