import { ConflictException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  PatientGender,
  UpdateAppointmentScheduleDto,
} from './dto/create-appointment.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: {
    reserveAppointment: jest.Mock;
    updateSchedule: jest.Mock;
  };

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
      dateOfBirth: '1990-05-20',
      gender: PatientGender.FEMENINO,
    },
  };

  beforeEach(() => {
    repository = {
      reserveAppointment: jest.fn(),
      updateSchedule: jest.fn(),
    };
    service = new AppointmentsService(
      repository as unknown as AppointmentsRepository,
    );
  });

  it('creates an appointment with a date-based unique code', async () => {
    repository.reserveAppointment.mockResolvedValue({
      id: 1n,
      code: 'APT-20260810-A1B2',
      doctorId: 7n,
      patientId: 3n,
      startAt: new Date(payload.startAt),
      endAt: new Date(payload.endAt),
    });

    const result = await service.create(payload);

    expect(repository.reserveAppointment).toHaveBeenCalledWith(
      expect.stringMatching(/^APT-20260810-[0-9A-F]{4}$/),
      payload,
    );
    expect(result).toEqual(expect.objectContaining({ id: 1, doctorId: 7 }));
  });

  it('propagates ConflictException when the selected slot is already reserved', async () => {
    repository.reserveAppointment.mockRejectedValue(
      new ConflictException(
        'The selected appointment time is no longer available.',
      ),
    );

    await expect(service.create(payload)).rejects.toThrow(ConflictException);
  });

  it('rejects an appointment whose end is not after its start', async () => {
    await expect(
      service.create({ ...payload, endAt: payload.startAt }),
    ).rejects.toThrow('startAt must be less than endAt.');

    expect(repository.reserveAppointment).not.toHaveBeenCalled();
  });

  it('updates an appointment schedule', async () => {
    const schedule: UpdateAppointmentScheduleDto = {
      startAt: '2026-08-11T11:00:00.000Z',
      endAt: '2026-08-11T11:30:00.000Z',
    };
    repository.updateSchedule.mockResolvedValue({
      id: 1n,
      appointmentDate: new Date('2026-08-11T00:00:00.000Z'),
    });

    const result = await service.updateSchedule(1, schedule);

    expect(repository.updateSchedule).toHaveBeenCalledWith(1, schedule);
    expect(result).toEqual(expect.objectContaining({ id: 1 }));
  });

  it('propagates ConflictException when the new schedule is unavailable', async () => {
    repository.updateSchedule.mockRejectedValue(
      new ConflictException(
        'The selected appointment time is no longer available.',
      ),
    );

    await expect(
      service.updateSchedule(1, {
        startAt: '2026-08-11T11:00:00.000Z',
        endAt: '2026-08-11T11:30:00.000Z',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
