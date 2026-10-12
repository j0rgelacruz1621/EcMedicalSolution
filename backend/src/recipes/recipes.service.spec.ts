import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../auth/current-user.decorator';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;
  let repository: Record<string, jest.Mock>;

  const doctorUser: RequestUser = {
    sub: 10,
    user_name: 'dr@example.com',
    rol: 'DOCTOR',
    doctorId: 3,
  };
  const adminUser: RequestUser = { sub: 1, user_name: 'admin', rol: 'SA' };

  const payload: CreateRecipeDto = {
    patient_id: 5,
    issue_date: '2026-07-13',
    medications: [
      {
        drug_name: 'Enalapril',
        presentation: '10 mg',
        dose: '1 tableta',
        frequency: 'Cada 12 horas',
        duration: '7 días',
      },
    ],
    additional_instructions: 'Reposo relativo.',
  };

  const storedRecipe = {
    id: 20n,
    patientId: 5n,
    doctorId: 3n,
    medicalCenterId: 2n,
    appointmentId: null,
    issueDate: new Date('2026-07-13T00:00:00.000Z'),
    headerImageUrl: 'https://cdn/doctor-3.png',
    additionalInstructions: 'Reposo relativo.',
    status: 'ACTIVE',
    versionType: 'ORIGINAL',
    supersedesRecipeId: null,
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    medications: [
      {
        drugName: 'Enalapril',
        presentation: '10 mg',
        dose: '1 tableta',
        frequency: 'Cada 12 horas',
        duration: '7 días',
      },
    ],
    patient: {
      id: 5n,
      firstName: 'Ricardo',
      lastName: 'Mendoza',
      nationalId: 'V-123',
      age: 54,
    },
    doctor: {
      id: 3n,
      firstName: 'Ana',
      lastName: 'Pérez',
      specialty: 'Cardiología',
      licenseNumber: 'MPPS-1',
      cmNumber: 'CM-9',
      phone: '0412-0000000',
      email: 'dr@example.com',
      headerImageUrl: 'https://cdn/doctor-3-new.png',
      office: { officeNumber: '12', locationDetails: 'Piso 2' },
    },
    medicalCenter: {
      id: 2n,
      name: 'Centro Médico',
      address: 'Av. Principal',
      phone: '0212-0000000',
      headerImageUrl: 'https://cdn/center-2.png',
    },
  };

  beforeEach(() => {
    repository = {
      findPatientById: jest.fn().mockResolvedValue({ id: 5n }),
      findDoctorById: jest.fn().mockResolvedValue({
        id: 3n,
        headerImageUrl: null,
        office: { medicalCenterId: 2n },
      }),
      findMedicalCenterById: jest
        .fn()
        .mockResolvedValue({ id: 2n, headerImageUrl: 'https://cdn/c.png' }),
      findAppointmentById: jest.fn(),
      create: jest.fn().mockResolvedValue(storedRecipe),
      findById: jest.fn().mockResolvedValue(storedRecipe),
      findManyByPatient: jest.fn().mockResolvedValue([storedRecipe]),
      countByPatient: jest.fn().mockResolvedValue(1),
      replaceWithNewVersion: jest.fn(),
    };

    service = new RecipesService(repository as never);
  });

  describe('create', () => {
    it('signs with the doctor from the JWT and falls back to the center letterhead', async () => {
      const result = await service.create(payload, doctorUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 5n,
          doctorId: 3n,
          medicalCenterId: 2n,
          headerImageUrl: 'https://cdn/c.png',
          issueDate: new Date('2026-07-13T00:00:00.000Z'),
        }),
      );
      expect(result).toMatchObject({
        recipe_id: 20,
        issue_date: '2026-07-13',
        medications: [{ drug_name: 'Enalapril' }],
      });
    });

    it('rejects a doctor issuing on behalf of another doctor', async () => {
      await expect(
        service.create({ ...payload, doctor_id: 99 }, doctorUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('requires doctor_id for SA accounts', async () => {
      await expect(service.create(payload, adminUser)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an appointment from a different patient', async () => {
      repository.findAppointmentById.mockResolvedValue({
        id: 1n,
        patientId: 77n,
      });

      await expect(
        service.create({ ...payload, appointment_id: 1 }, doctorUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an unknown patient', async () => {
      repository.findPatientById.mockResolvedValue(null);

      await expect(service.create(payload, doctorUser)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findByPatient', () => {
    it('lists only current versions by default', async () => {
      const result = await service.findByPatient(5, {});

      expect(repository.findManyByPatient).toHaveBeenCalledWith(
        5n,
        false,
        0,
        10,
      );
      expect(result.total).toBe(1);
      expect(result.data[0].doctor.full_name).toBe('Ana Pérez');
    });

    it('throws when the patient does not exist', async () => {
      repository.findPatientById.mockResolvedValue(null);

      await expect(service.findByPatient(5, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const changes = {
      medications: [{ drug_name: 'Losartán' }],
      additional_instructions: '',
    };

    it('creates a new version linked to the previous one', async () => {
      repository.replaceWithNewVersion.mockResolvedValue({
        ...storedRecipe,
        id: 21n,
        supersedesRecipeId: 20n,
      });

      const result = await service.update(20, changes, doctorUser);

      expect(repository.replaceWithNewVersion).toHaveBeenCalledWith(
        storedRecipe,
        changes.medications,
        null,
      );
      expect(result).toMatchObject({ recipe_id: 21, supersedes_recipe_id: 20 });
    });

    it('forbids editing another doctor recipe', async () => {
      await expect(
        service.update(20, changes, { ...doctorUser, doctorId: 4 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects editing a superseded version', async () => {
      repository.findById.mockResolvedValue({
        ...storedRecipe,
        status: 'EDITED',
        versionType: 'SUPERSEDED',
      });

      await expect(
        service.update(20, changes, doctorUser),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reports a concurrent edit', async () => {
      repository.replaceWithNewVersion.mockResolvedValue(null);

      await expect(
        service.update(20, changes, adminUser),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getPrintableDocument', () => {
    it('uses the letterhead stored with the recipe and builds the footer', async () => {
      const document = await service.getPrintableDocument(20);

      expect(document.header.image_url).toBe('https://cdn/doctor-3.png');
      expect(document.footer).toEqual({
        address: 'Consultorio 12, Piso 2 · Av. Principal',
        phones: ['0412-0000000', '0212-0000000'],
        email: 'dr@example.com',
        license_number: 'MPPS-1',
        cm_number: 'CM-9',
      });
    });
  });
});
