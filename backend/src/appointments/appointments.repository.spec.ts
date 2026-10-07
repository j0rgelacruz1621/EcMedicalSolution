import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentsRepository } from './appointments.repository';
import {
  CreateAppointmentDto,
  PatientGender,
} from './dto/create-appointment.dto';

describe('AppointmentsRepository', () => {
  let repository: AppointmentsRepository;
  let transaction: {
    appointment: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    doctor: { findUnique: jest.Mock };
    patient: { findUnique: jest.Mock; upsert: jest.Mock };
    $executeRaw: jest.Mock;
    $queryRaw: jest.Mock;
  };
  let prisma: { $transaction: jest.Mock };

  const current = {
    id: 1n,
    appointmentCode: 'APT-20260810-A1B2',
    doctorId: 7n,
    officeId: 1n,
    appointmentDate: new Date('2026-08-10T00:00:00.000Z'),
    startTime: new Date('1970-01-01T10:00:00.000Z'),
    endTime: new Date('1970-01-01T10:30:00.000Z'),
    status: 'SCHEDULED',
  };

  beforeEach(() => {
    transaction = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(({ data }: { data: object }) => ({
          ...current,
          ...data,
        })),
        create: jest.fn().mockResolvedValue({ id: 1n }),
      },
      doctor: { findUnique: jest.fn().mockResolvedValue({ id: 7n }) },
      patient: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 3n }),
      },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    repository = new AppointmentsRepository(prisma as unknown as PrismaService);
  });

  describe('reserveAppointment', () => {
    const payload: CreateAppointmentDto = {
      doctorId: 7,
      medicalCenterId: 1,
      officeId: 1,
      startAt: '2026-08-10T10:00:00.000Z',
      endAt: '2026-08-10T10:30:00.000Z',
      patient: {
        nationalId: '0912345678',
        firstName: 'María',
        lastName: 'López',
        email: 'maria@example.com',
        phone: '0999999999',
        age: 34,
        gender: PatientGender.FEMENINO,
      },
    };

    it('rejects scheduling for an inactive patient without touching any record', async () => {
      transaction.patient.findUnique.mockResolvedValue({ isActive: false });

      await expect(
        repository.reserveAppointment('APT-20260810-A1B2', payload),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(transaction.patient.findUnique).toHaveBeenCalledWith({
        where: { nationalId: '0912345678' },
        select: { isActive: true },
      });
      expect(transaction.patient.upsert).not.toHaveBeenCalled();
      expect(transaction.appointment.create).not.toHaveBeenCalled();
    });

    it.each([
      ['an active patient', { isActive: true }],
      ['a patient whose is_active is null', { isActive: null }],
      ['a patient that is not registered yet', null],
    ])('schedules the appointment for %s', async (_case, patient) => {
      transaction.patient.findUnique.mockResolvedValue(patient);

      await repository.reserveAppointment('APT-20260810-A1B2', payload);

      expect(transaction.patient.upsert).toHaveBeenCalled();
      expect(transaction.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appointmentCode: 'APT-20260810-A1B2',
            patientId: 3n,
            status: 'SCHEDULED',
          }) as unknown,
        }),
      );
    });
  });

  describe('cancelAppointment', () => {
    it('cancels a scheduled appointment by numeric id', async () => {
      transaction.appointment.findUnique.mockResolvedValue(current);

      const result = await repository.cancelAppointment('1');

      expect(transaction.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
      });
      expect(transaction.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1n },
          data: { status: 'CANCELLED' },
        }),
      );
      expect(result).toEqual(expect.objectContaining({ status: 'CANCELLED' }));
    });

    it('looks the appointment up by appointment_code when the value is not numeric', async () => {
      transaction.appointment.findUnique.mockResolvedValue(current);

      await repository.cancelAppointment('APT-20260810-A1B2');

      expect(transaction.appointment.findUnique).toHaveBeenCalledWith({
        where: { appointmentCode: 'APT-20260810-A1B2' },
      });
    });

    it('throws NotFoundException when the appointment does not exist', async () => {
      transaction.appointment.findUnique.mockResolvedValue(null);

      await expect(repository.cancelAppointment('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(transaction.appointment.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException without querying when the numeric id exceeds the bigint range', async () => {
      await expect(
        repository.cancelAppointment('9223372036854775808'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each(['COMPLETED', 'CANCELLED', 'NO_SHOW'])(
      'throws UnprocessableEntityException when the appointment is %s',
      async (status) => {
        transaction.appointment.findUnique.mockResolvedValue({
          ...current,
          status,
        });

        await expect(repository.cancelAppointment('1')).rejects.toThrow(
          UnprocessableEntityException,
        );
        expect(transaction.appointment.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('updateAppointment', () => {
    it.each(['COMPLETED', 'NO_SHOW'])(
      'rejects changing the status to CANCELLED when the appointment is %s',
      async (status) => {
        transaction.appointment.findUnique.mockResolvedValue({
          ...current,
          status,
        });

        await expect(
          repository.updateAppointment(1, { status: 'CANCELLED' }),
        ).rejects.toThrow(UnprocessableEntityException);
        expect(transaction.appointment.update).not.toHaveBeenCalled();
      },
    );

    it('allows changing the status to CANCELLED when the appointment is still cancelable', async () => {
      transaction.appointment.findUnique.mockResolvedValue(current);

      const result = await repository.updateAppointment(1, {
        status: 'CANCELLED',
      });

      expect(result).toEqual(expect.objectContaining({ status: 'CANCELLED' }));
    });

    it('allows other updates on a completed appointment', async () => {
      transaction.appointment.findUnique.mockResolvedValue({
        ...current,
        status: 'COMPLETED',
      });

      const result = await repository.updateAppointment(1, { office_id: 2 });

      expect(result).toEqual(
        expect.objectContaining({ status: 'COMPLETED', officeId: 2n }),
      );
    });
  });
});
