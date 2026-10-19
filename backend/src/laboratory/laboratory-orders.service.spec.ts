import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../auth/current-user.decorator';
import { CreateLaboratoryOrderDto } from './dto/create-laboratory-order.dto';
import { buildOrderFixture } from './laboratory-order.fixture';
import { LaboratoryOrdersService } from './laboratory-orders.service';

describe('LaboratoryOrdersService', () => {
  let service: LaboratoryOrdersService;
  let repository: Record<string, jest.Mock>;
  const order = buildOrderFixture();

  const doctorUser: RequestUser = {
    sub: 10,
    user_name: 'dr@example.com',
    rol: 'DOCTOR',
    doctorId: 3,
  };
  const adminUser: RequestUser = { sub: 1, user_name: 'admin', rol: 'SA' };

  const payload: CreateLaboratoryOrderDto = {
    patient_id: 5,
    doctor_id: 3,
    issue_date: '2026-10-08',
    diagnosis: 'Evaluación preventiva anual',
    tests: [
      { test_id: 1, category_id: 2 },
      { test_id: 3, category_id: 1 },
    ],
    custom_tests: [
      { category_name: 'Inmunología', test_name: 'Antígeno no catalogado' },
    ],
    additional_notes: 'Ayunar mínimo 8 a 12 horas.',
  };

  const catalog = [
    {
      id: 1n,
      categoryId: 2n,
      isActive: true,
      name: 'Glicemia',
      category: { isActive: true },
    },
    {
      id: 3n,
      categoryId: 1n,
      isActive: true,
      name: 'Hematología',
      category: { isActive: true },
    },
  ];

  beforeEach(() => {
    repository = {
      findPatientById: jest.fn().mockResolvedValue({ id: 5n }),
      findDoctorById: jest.fn().mockResolvedValue({
        id: 3n,
        headerImageUrl: 'https://cdn/doctor-3.png',
        office: { medicalCenterId: 2n },
      }),
      findMedicalCenterById: jest
        .fn()
        .mockResolvedValue({ id: 2n, headerImageUrl: null }),
      findAppointmentById: jest.fn(),
      findTestsByIds: jest.fn().mockResolvedValue(catalog),
      create: jest.fn().mockResolvedValue(order),
      findById: jest.fn().mockResolvedValue(order),
      findManyByPatient: jest.fn().mockResolvedValue([order]),
      countByPatient: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(order),
    };
    service = new LaboratoryOrdersService(repository as never);
  });

  describe('create', () => {
    it('persists the order with catalog and custom items', async () => {
      const result = await service.create(payload, doctorUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 5n,
          doctorId: 3n,
          medicalCenterId: 2n,
          issueDate: new Date('2026-10-08T00:00:00.000Z'),
          headerImageUrl: 'https://cdn/doctor-3.png',
          status: 'ACTIVE',
        }),
        {
          tests: [
            { testId: 1n, categoryId: 2n },
            { testId: 3n, categoryId: 1n },
          ],
          customTests: [
            { categoryName: 'Inmunología', testName: 'Antígeno no catalogado' },
          ],
        },
      );
      expect(result).toMatchObject({
        id: 12,
        issue_date: '2026-10-08',
        tests: [
          { test_id: 1, category_name: 'Bioquímica', internal_code: 'BIO-01' },
          { test_id: 3, category_name: 'Hematología' },
        ],
        custom_tests: [{ category_name: 'Inmunología' }],
      });
    });

    it('accepts an order with only custom tests', async () => {
      await service.create({ ...payload, tests: undefined }, doctorUser);
      expect(repository.findTestsByIds).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalled();
    });

    it('requires at least one test before touching the database', async () => {
      await expect(
        service.create(
          { ...payload, tests: [], custom_tests: undefined },
          doctorUser,
        ),
      ).rejects.toThrow(/at least one item/);
      expect(repository.findPatientById).not.toHaveBeenCalled();
    });

    it('rejects a test sent with a category it does not belong to', async () => {
      await expect(
        service.create(
          { ...payload, tests: [{ test_id: 1, category_id: 1 }] },
          doctorUser,
        ),
      ).rejects.toThrow(/belongs to category_id 2/);
    });

    it('rejects unknown, duplicated and inactive tests', async () => {
      await expect(
        service.create(
          { ...payload, tests: [{ test_id: 99, category_id: 1 }] },
          doctorUser,
        ),
      ).rejects.toThrow(/does not exist/);

      await expect(
        service.create(
          {
            ...payload,
            tests: [
              { test_id: 1, category_id: 2 },
              { test_id: 1, category_id: 2 },
            ],
          },
          doctorUser,
        ),
      ).rejects.toThrow(/duplicated/);

      repository.findTestsByIds.mockResolvedValue([
        { ...catalog[0], category: { isActive: false } },
      ]);
      await expect(
        service.create(
          { ...payload, tests: [{ test_id: 1, category_id: 2 }] },
          doctorUser,
        ),
      ).rejects.toThrow(/inactive/);
    });

    it('rejects a doctor issuing on behalf of another doctor', async () => {
      await expect(
        service.create({ ...payload, doctor_id: 99 }, doctorUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an unknown patient', async () => {
      repository.findPatientById.mockResolvedValue(null);
      await expect(service.create(payload, adminUser)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('queries', () => {
    it('lists a patient history newest first with pagination', async () => {
      const result = await service.findByPatient(5, { page: 2, limit: 5 });
      expect(repository.findManyByPatient).toHaveBeenCalledWith(5n, 5, 5);
      expect(result).toMatchObject({ total: 1, page: 2, limit: 5 });
    });

    it('returns 404 for a missing patient or order', async () => {
      repository.findPatientById.mockResolvedValue(null);
      await expect(service.findByPatient(5, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );

      repository.findById.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('replaces only the lists that are sent and marks the order EDITED', async () => {
      await service.update(
        12,
        { diagnosis: '', custom_tests: [{ test_name: 'Prueba libre' }] },
        doctorUser,
      );

      expect(repository.update).toHaveBeenCalledWith(
        12n,
        ['ACTIVE', 'EDITED'],
        { status: 'EDITED', diagnosis: null },
        { customTests: [{ categoryName: null, testName: 'Prueba libre' }] },
      );
    });

    it('keeps tests already in the order even if they were deactivated', async () => {
      repository.findTestsByIds.mockResolvedValue([
        { ...catalog[0], isActive: false },
      ]);
      await service.update(
        12,
        { tests: [{ test_id: 1, category_id: 2 }] },
        doctorUser,
      );
      expect(repository.update).toHaveBeenCalled();
    });

    it('does not leave the order without tests', async () => {
      await expect(
        service.update(12, { tests: [], custom_tests: [] }, doctorUser),
      ).rejects.toThrow(/at least one item/);
    });

    it.each(['SIGNED', 'CANCELLED'])(
      'rejects changes to a %s order',
      async (status) => {
        repository.findById.mockResolvedValue(buildOrderFixture({ status }));
        await expect(
          service.update(12, { diagnosis: 'x' }, doctorUser),
        ).rejects.toBeInstanceOf(ConflictException);
      },
    );

    it('forbids editing another doctor order', async () => {
      await expect(
        service.update(12, { diagnosis: 'x' }, { ...doctorUser, doctorId: 4 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('reports a concurrent status change', async () => {
      repository.update.mockResolvedValue(null);
      await expect(
        service.update(12, { diagnosis: 'x' }, doctorUser),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an empty body', async () => {
      await expect(service.update(12, {}, doctorUser)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('sign and cancel', () => {
    it('signs an open order and refuses to sign twice', async () => {
      await service.sign(12, doctorUser);
      expect(repository.update).toHaveBeenCalledWith(
        12n,
        ['ACTIVE', 'EDITED'],
        { status: 'SIGNED' },
      );

      repository.findById.mockResolvedValue(
        buildOrderFixture({ status: 'SIGNED' }),
      );
      await expect(service.sign(12, doctorUser)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('cancels a signed order', async () => {
      repository.findById.mockResolvedValue(
        buildOrderFixture({ status: 'SIGNED' }),
      );
      await service.cancel(12, adminUser);
      expect(repository.update).toHaveBeenCalledWith(
        12n,
        ['ACTIVE', 'EDITED', 'SIGNED'],
        { status: 'CANCELLED' },
      );
    });
  });
});
