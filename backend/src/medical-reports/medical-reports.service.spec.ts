import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RequestUser } from '../auth/current-user.decorator';
import { CreateMedicalReportDto } from './dto/create-medical-report.dto';
import { MedicalReportsService } from './medical-reports.service';

const d = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('MedicalReportsService', () => {
  let service: MedicalReportsService;
  let repository: Record<string, jest.Mock>;

  const doctorUser: RequestUser = {
    sub: 10,
    user_name: 'dr@example.com',
    rol: 'DOCTOR',
    doctorId: 3,
  };
  const adminUser: RequestUser = { sub: 1, user_name: 'admin', rol: 'SA' };

  const payload: CreateMedicalReportDto = {
    patient_id: 5,
    doctor_id: 3,
    type: 'REPOSO_MEDICO',
    title: 'Informe de Reposo Médico',
    description: 'Reposo relativo por síndrome febril',
    content: 'Se indica reposo físico absoluto en casa.',
    issue_date: '2026-10-08',
    rest_start_date: '2026-10-08',
    rest_end_date: '2026-10-11',
    diagnosis_code: 'J06.9',
  };

  const storedReport = {
    id: 15n,
    patientId: 5n,
    doctorId: 3n,
    medicalCenterId: 2n,
    appointmentId: null,
    type: 'REPOSO_MEDICO',
    title: 'Informe de Reposo Médico',
    description: 'Reposo relativo por síndrome febril',
    content: 'Se indica reposo físico absoluto en casa.',
    issueDate: d('2026-10-08'),
    restStartDate: d('2026-10-08'),
    restEndDate: d('2026-10-11'),
    restDays: 4,
    diagnosisCode: 'J06.9',
    diagnosis: null,
    headerImageUrl: 'https://cdn/doctor-3.png',
    status: 'ACTIVE',
    createdAt: new Date('2026-10-08T12:00:00.000Z'),
    updatedAt: new Date('2026-10-08T12:00:00.000Z'),
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
      specialty: 'Medicina Interna',
      licenseNumber: 'MPPS-1',
      cmNumber: 'CM-9',
      phone: '0412-0000000',
      email: 'dr@example.com',
      headerImageUrl: null,
      office: { officeNumber: '12', locationDetails: 'Piso 2' },
    },
    medicalCenter: {
      id: 2n,
      name: 'Centro Médico',
      address: 'Av. Principal',
      phone: null,
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
      create: jest.fn().mockResolvedValue(storedReport),
      findById: jest.fn().mockResolvedValue(storedReport),
      findMany: jest.fn().mockResolvedValue([storedReport]),
      count: jest.fn().mockResolvedValue(1),
      updateIfStatusIn: jest.fn().mockResolvedValue(storedReport),
    };

    service = new MedicalReportsService(repository as never);
  });

  describe('create', () => {
    it('persists a rest report with the computed period and letterhead', async () => {
      const result = await service.create(payload, doctorUser);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 5n,
          doctorId: 3n,
          medicalCenterId: 2n,
          type: 'REPOSO_MEDICO',
          issueDate: d('2026-10-08'),
          restStartDate: d('2026-10-08'),
          restEndDate: d('2026-10-11'),
          restDays: 4,
          diagnosisCode: 'J06.9',
          headerImageUrl: 'https://cdn/c.png',
        }),
      );
      expect(result).toMatchObject({
        id: 15,
        issue_date: '2026-10-08',
        rest_end_date: '2026-10-11',
        rest_days: 4,
        patient: { full_name: 'Ricardo Mendoza' },
      });
    });

    it('defaults to INFORME_MEDICO without rest fields', async () => {
      await service.create(
        {
          patient_id: 5,
          doctor_id: 3,
          title: 'Informe',
          content: 'Contenido',
          issue_date: '2026-10-08',
        },
        doctorUser,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INFORME_MEDICO',
          restStartDate: null,
          restDays: null,
        }),
      );
    });

    it('validates the rest period before touching the database', async () => {
      await expect(
        service.create({ ...payload, rest_days: 3 }, doctorUser),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findPatientById).not.toHaveBeenCalled();
    });

    it('rejects a doctor issuing on behalf of another doctor', async () => {
      await expect(
        service.create({ ...payload, doctor_id: 99 }, doctorUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets SA accounts issue for any doctor', async () => {
      await service.create(payload, adminUser);
      expect(repository.create).toHaveBeenCalled();
    });

    it('rejects an unknown patient', async () => {
      repository.findPatientById.mockResolvedValue(null);
      await expect(service.create(payload, doctorUser)).rejects.toBeInstanceOf(
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
  });

  describe('findByPatient', () => {
    it('applies type and issue date filters', async () => {
      const result = await service.findByPatient(5, {
        type: 'REPOSO_MEDICO',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        page: 2,
        limit: 5,
      });

      expect(repository.findMany).toHaveBeenCalledWith(
        {
          patientId: 5n,
          type: 'REPOSO_MEDICO',
          issuedFrom: d('2026-10-01'),
          issuedTo: d('2026-10-31'),
        },
        5,
        5,
      );
      expect(result).toMatchObject({ total: 1, page: 2, limit: 5 });
    });

    it('rejects an inverted date range', async () => {
      await expect(
        service.findByPatient(5, {
          startDate: '2026-10-31',
          endDate: '2026-10-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when the patient does not exist', async () => {
      repository.findPatientById.mockResolvedValue(null);
      await expect(service.findByPatient(5, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns 404 when the report does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates the editable fields and marks the report as EDITED', async () => {
      await service.update(
        15,
        { title: 'Nuevo título', rest_days: 6, description: '' },
        doctorUser,
      );

      expect(repository.updateIfStatusIn).toHaveBeenCalledWith(
        15n,
        ['ACTIVE', 'EDITED'],
        {
          status: 'EDITED',
          title: 'Nuevo título',
          description: null,
          restStartDate: d('2026-10-08'),
          restEndDate: d('2026-10-13'),
          restDays: 6,
        },
      );
    });

    it('rejects an empty body', async () => {
      await expect(service.update(15, {}, doctorUser)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it.each(['SIGNED', 'CANCELLED'])(
      'rejects changes to a %s report',
      async (status) => {
        repository.findById.mockResolvedValue({ ...storedReport, status });
        await expect(
          service.update(15, { title: 'x' }, doctorUser),
        ).rejects.toBeInstanceOf(ConflictException);
      },
    );

    it('forbids editing another doctor report', async () => {
      await expect(
        service.update(15, { title: 'x' }, { ...doctorUser, doctorId: 4 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('reports a concurrent status change', async () => {
      repository.updateIfStatusIn.mockResolvedValue(null);
      await expect(
        service.update(15, { title: 'x' }, doctorUser),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('sign and cancel', () => {
    it('signs an open report', async () => {
      await service.sign(15, doctorUser);
      expect(repository.updateIfStatusIn).toHaveBeenCalledWith(
        15n,
        ['ACTIVE', 'EDITED'],
        { status: 'SIGNED' },
      );
    });

    it('does not sign a report twice', async () => {
      repository.findById.mockResolvedValue({
        ...storedReport,
        status: 'SIGNED',
      });
      await expect(service.sign(15, doctorUser)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('cancels a signed report', async () => {
      repository.findById.mockResolvedValue({
        ...storedReport,
        status: 'SIGNED',
      });
      await service.cancel(15, adminUser);
      expect(repository.updateIfStatusIn).toHaveBeenCalledWith(
        15n,
        ['ACTIVE', 'EDITED', 'SIGNED'],
        { status: 'CANCELLED' },
      );
    });
  });

  describe('getPrintableDocument', () => {
    it('combines the stored letterhead, report body and footer', async () => {
      const document = await service.getPrintableDocument(15);

      expect(document.header.image_url).toBe('https://cdn/doctor-3.png');
      expect(document.medical_report).toMatchObject({
        title: 'Informe de Reposo Médico',
        rest_days: 4,
        diagnosis_code: 'J06.9',
      });
      expect(document.footer).toEqual({
        address: 'Consultorio 12, Piso 2 · Av. Principal',
        phones: ['0412-0000000'],
        email: 'dr@example.com',
        license_number: 'MPPS-1',
        cm_number: 'CM-9',
      });
    });
  });
});
