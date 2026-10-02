import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';
import { CreatePatientDto, PatientGender } from './dto/create-patient.dto';

describe('PatientsService', () => {
  let service: PatientsService;
  let repository: {
    findByNationalId: jest.Mock;
    findByEmail: jest.Mock;
    findDoctorById: jest.Mock;
    findById: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findLatestVitals: jest.Mock;
    findLatestVitalsForPatients: jest.Mock;
    updatePatientOnly: jest.Mock;
    updatePatientWithVitals: jest.Mock;
    createPatientOnly: jest.Mock;
    createPatientWithVitals: jest.Mock;
  };

  const payload: CreatePatientDto = {
    nationalId: '0912345678',
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'maria@example.com',
    phone: '0999999999',
    age: 34,
    gender: PatientGender.FEMENINO,
  };

  beforeEach(() => {
    repository = {
      findByNationalId: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      findDoctorById: jest.fn().mockResolvedValue({ id: 5n }),
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findLatestVitals: jest.fn().mockResolvedValue(null),
      findLatestVitalsForPatients: jest.fn().mockResolvedValue([]),
      updatePatientOnly: jest
        .fn()
        .mockImplementation((id: bigint, data: object) => ({ id, ...data })),
      updatePatientWithVitals: jest.fn(),
      createPatientOnly: jest.fn(),
      createPatientWithVitals: jest.fn(),
    };
    service = new PatientsService(repository as unknown as PatientsRepository);
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

  it('reports the email as the conflicting field when the unique constraint is on email', async () => {
    repository.createPatientOnly.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      }),
    );

    await expect(service.create(payload)).rejects.toThrow(
      `A patient with email "${payload.email}" already exists.`,
    );
  });

  it('leaves isActive undefined so the database default applies when it is not sent', async () => {
    repository.createPatientOnly.mockResolvedValue({ id: 1n });

    await service.create(payload);

    expect(repository.createPatientOnly).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: undefined, gender: 'Female' }),
    );
  });

  it('registers a patient without age', async () => {
    repository.createPatientOnly.mockResolvedValue({ id: 1n, age: null });
    const result = await service.create({ ...payload, age: undefined });

    expect(repository.createPatientOnly).toHaveBeenCalledWith(
      expect.objectContaining({ age: undefined }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        patient: expect.objectContaining({ age: null }),
      }),
    );
  });

  it('persists isActive when it is sent explicitly', async () => {
    repository.createPatientOnly.mockResolvedValue({ id: 1n });

    await service.create({ ...payload, isActive: false });

    expect(repository.createPatientOnly).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('assigns the doctor when assignedDoctorId matches an existing doctor', async () => {
    repository.createPatientOnly.mockResolvedValue({ id: 1n });

    await service.create({ ...payload, assignedDoctorId: 5 });

    expect(repository.findDoctorById).toHaveBeenCalledWith(5n);
    expect(repository.createPatientOnly).toHaveBeenCalledWith(
      expect.objectContaining({ assignedDoctorId: 5n }),
    );
  });

  it('rejects with BadRequestException when assignedDoctorId does not exist', async () => {
    repository.findDoctorById.mockResolvedValue(null);

    await expect(
      service.create({ ...payload, assignedDoctorId: 999 }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.createPatientOnly).not.toHaveBeenCalled();
  });

  it('translates a foreign key database error into a BadRequestException', async () => {
    repository.createPatientOnly.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        },
      ),
    );

    await expect(
      service.create({ ...payload, assignedDoctorId: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  describe('findAll', () => {
    it('uses page 1 and limit 10 by default', async () => {
      const result = await service.findAll({});

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.any(Object),
        0,
        10,
      );
      expect(result).toEqual(
        expect.objectContaining({ data: [], page: 1, limit: 10, total: 0 }),
      );
    });

    it('forwards the filters and the requested page to the repository', async () => {
      await service.findAll({
        nationalId: '0912',
        search: 'maria lopez',
        isActive: false,
        page: 3,
        limit: 5,
      });

      const filters = expect.objectContaining({
        nationalId: '0912',
        search: 'maria lopez',
        isActive: false,
      }) as unknown;
      expect(repository.findMany).toHaveBeenCalledWith(filters, 10, 5);
      expect(repository.count).toHaveBeenCalledWith(filters);
    });

    it('attaches the latest vitals to each patient', async () => {
      repository.findMany.mockResolvedValue([{ id: 1n }, { id: 2n }]);
      repository.count.mockResolvedValue(2);
      repository.findLatestVitalsForPatients.mockResolvedValue([
        { id: 9n, patient_id: 2n, heart_rate_bpm: 70 },
      ]);

      const result = await service.findAll({});

      expect(result.data).toEqual([
        { id: 1, latestVitals: null },
        {
          id: 2,
          latestVitals: { id: 9, patient_id: 2, heart_rate_bpm: 70 },
        },
      ]);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns the patient with its latest vitals', async () => {
      repository.findById.mockResolvedValue({ id: 1n, firstName: 'Maria' });
      repository.findLatestVitals.mockResolvedValue({ id: 9n, patient_id: 1n });

      const result = await service.findOne(1);

      expect(repository.findById).toHaveBeenCalledWith(1n);
      expect(result).toEqual({
        id: 1,
        firstName: 'Maria',
        latestVitals: { id: 9, patient_id: 1 },
      });
    });

    it('throws NotFoundException when the patient does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findLatestVitals).not.toHaveBeenCalled();
    });
  });

  describe('update (PATCH)', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue({ id: 1n, ...payload });
    });

    it('updates only the fields that were sent', async () => {
      const result = await service.update(1, { phone: '0988888888' });

      const [id, data] = repository.updatePatientOnly.mock.calls[0] as [
        bigint,
        Record<string, unknown>,
      ];
      expect(id).toBe(1n);
      expect(data.phone).toBe('0988888888');
      expect(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ).toEqual([['phone', '0988888888']]);
      expect(result).toEqual(
        expect.objectContaining({
          patient: expect.objectContaining({ id: 1, phone: '0988888888' }),
          vitals: null,
        }),
      );
    });

    it('throws NotFoundException when the patient does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(999, { phone: '1' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
    });

    it('rejects a national_id that belongs to another patient', async () => {
      repository.findByNationalId.mockResolvedValue({ id: 2n });

      await expect(
        service.update(1, { nationalId: '0999999999' }),
      ).rejects.toThrow(ConflictException);
      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
    });

    it('allows sending the national_id the patient already has', async () => {
      repository.findByNationalId.mockResolvedValue({ id: 1n });

      await expect(
        service.update(1, { nationalId: payload.nationalId }),
      ).resolves.toBeDefined();
    });

    it('rejects an email that belongs to another patient', async () => {
      repository.findByEmail.mockResolvedValue({ id: 2n });

      await expect(
        service.update(1, { email: 'otro@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(repository.findByEmail).toHaveBeenCalledWith(
        'otro@example.com',
        1n,
      );
      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
    });

    it('does not check uniqueness when neither national_id nor email are sent', async () => {
      await service.update(1, { firstName: 'Ana' });

      expect(repository.findByNationalId).not.toHaveBeenCalled();
      expect(repository.findByEmail).not.toHaveBeenCalled();
    });

    it('clears nullable fields when null is sent', async () => {
      await service.update(1, { assignedDoctorId: null, origin: null });

      expect(repository.findDoctorById).not.toHaveBeenCalled();
      expect(repository.updatePatientOnly).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({ assignedDoctorId: null, origin: null }),
      );
    });

    it('rejects an assignedDoctorId that does not exist', async () => {
      repository.findDoctorById.mockResolvedValue(null);

      await expect(
        service.update(1, { assignedDoctorId: 999 }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
    });

    it('records a new vitals measurement when vitals are sent', async () => {
      repository.updatePatientWithVitals.mockResolvedValue({
        patient: { id: 1n },
        vitals: { id: 7n },
      });

      const result = await service.update(1, {
        vitals: { bloodPressure: '120/80' },
      });

      expect(repository.updatePatientWithVitals).toHaveBeenCalledWith(
        1n,
        expect.any(Object),
        expect.objectContaining({
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
        }),
      );
      expect(result).toEqual({ patient: { id: 1 }, vitals: { id: 7 } });
    });

    it.each([
      ['P2002', ConflictException],
      ['P2003', BadRequestException],
      ['P2025', NotFoundException],
    ])('translates database error %s', async (code, exception) => {
      repository.updatePatientOnly.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Database error', {
          code,
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.update(1, { phone: '1' })).rejects.toThrow(
        exception,
      );
    });
  });

  describe('replace (PUT)', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue({ id: 1n, ...payload });
    });

    it('resets the optional fields that were not sent', async () => {
      await service.replace(1, { ...payload, age: undefined });

      expect(repository.updatePatientOnly).toHaveBeenCalledWith(1n, {
        nationalId: payload.nationalId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        gender: 'Female',
        age: null,
        origin: null,
        address: null,
        assignedDoctorId: null,
        medicalHistoryNotes: null,
        isActive: true,
      });
    });

    it('keeps the optional fields that were sent', async () => {
      await service.replace(1, {
        ...payload,
        origin: 'Mérida',
        assignedDoctorId: 5,
        isActive: false,
      });

      expect(repository.updatePatientOnly).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          age: 34,
          origin: 'Mérida',
          assignedDoctorId: 5n,
          isActive: false,
        }),
      );
    });

    it('rejects when the national_id or email belong to another patient', async () => {
      repository.findByNationalId.mockResolvedValue({ id: 2n });

      await expect(service.replace(1, payload)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the patient does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.replace(999, payload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove (DELETE)', () => {
    it('deactivates the patient without deleting the row', async () => {
      repository.findById.mockResolvedValue({ id: 1n, isActive: true });

      const result = await service.remove(1);

      expect(repository.updatePatientOnly).toHaveBeenCalledWith(1n, {
        isActive: false,
      });
      expect(result).toEqual({ id: 1, isActive: false });
    });

    it('deactivates a patient whose is_active is null', async () => {
      repository.findById.mockResolvedValue({ id: 1n, isActive: null });

      await service.remove(1);

      expect(repository.updatePatientOnly).toHaveBeenCalledWith(1n, {
        isActive: false,
      });
    });

    it('is idempotent: an inactive patient is returned without writing again', async () => {
      repository.findById.mockResolvedValue({ id: 1n, isActive: false });

      const result = await service.remove(1);

      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 1, isActive: false });
    });

    it('throws NotFoundException when the patient does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.updatePatientOnly).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the patient disappears before the write', async () => {
      repository.findById.mockResolvedValue({ id: 1n, isActive: true });
      repository.updatePatientOnly.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
