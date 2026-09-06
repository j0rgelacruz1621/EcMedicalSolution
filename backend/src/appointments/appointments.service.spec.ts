import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, PatientGender } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: {
    reserveAppointment: jest.Mock;
    updateAppointment: jest.Mock;
    cancelAppointment: jest.Mock;
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
      updateAppointment: jest.fn(),
      cancelAppointment: jest.fn(),
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

  it('updates an appointment', async () => {
    const payload: UpdateAppointmentDto = {
      start_time: '11:00:00',
      end_time: '11:30:00',
    };
    repository.updateAppointment.mockResolvedValue({
      id: 1n,
      appointmentDate: new Date('2026-08-11T00:00:00.000Z'),
    });

    const result = await service.update(1, payload);

    expect(repository.updateAppointment).toHaveBeenCalledWith(1, payload);
    expect(result).toEqual(expect.objectContaining({ id: 1 }));
  });

  it('propagates NotFoundException when the appointment does not exist', async () => {
    repository.updateAppointment.mockRejectedValue(
      new NotFoundException('Appointment not found.'),
    );

    await expect(
      service.update(999, { status: 'CONFIRMED' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('propagates BadRequestException when end_time is not after start_time', async () => {
    repository.updateAppointment.mockRejectedValue(
      new BadRequestException('end_time must be greater than start_time.'),
    );

    await expect(
      service.update(1, { start_time: '11:00:00', end_time: '10:00:00' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('propagates ConflictException when the new schedule overlaps another appointment', async () => {
    repository.updateAppointment.mockRejectedValue(
      new ConflictException(
        'The doctor already has another appointment overlapping this schedule.',
      ),
    );

    await expect(
      service.update(1, { start_time: '11:00:00', end_time: '11:30:00' }),
    ).rejects.toThrow(ConflictException);
  });

  it('cancels an appointment by id', async () => {
    repository.cancelAppointment.mockResolvedValue({
      id: 1n,
      status: 'CANCELLED',
    });

    const result = await service.cancel('1');

    expect(repository.cancelAppointment).toHaveBeenCalledWith('1');
    expect(result).toEqual(
      expect.objectContaining({ id: 1, status: 'CANCELLED' }),
    );
  });

  it('cancels an appointment by appointment_code', async () => {
    repository.cancelAppointment.mockResolvedValue({
      id: 1n,
      appointmentCode: 'APT-20260810-A1B2',
      status: 'CANCELLED',
    });

    await service.cancel('APT-20260810-A1B2');

    expect(repository.cancelAppointment).toHaveBeenCalledWith(
      'APT-20260810-A1B2',
    );
  });

  it('propagates NotFoundException when cancelling a nonexistent appointment', async () => {
    repository.cancelAppointment.mockRejectedValue(
      new NotFoundException('Appointment not found.'),
    );

    await expect(service.cancel('999')).rejects.toThrow(NotFoundException);
  });

  it('propagates UnprocessableEntityException when the appointment is already completed', async () => {
    repository.cancelAppointment.mockRejectedValue(
      new UnprocessableEntityException(
        'Appointment cannot be cancelled because it is already COMPLETED.',
      ),
    );

    await expect(service.cancel('1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });
});
