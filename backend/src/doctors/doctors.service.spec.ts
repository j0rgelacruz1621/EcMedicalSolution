import { BadRequestException, ConflictException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsRepository } from './doctors.repository';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedules.dto';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let repository: {
    findManyWithSchedules: any;
    countDoctors: any;
    findDoctorByIdWithSchedules: any;
    findDoctorByUniqueFields: any;
    findOfficeById: any;
    createDoctor: any;
    findDoctorById: any;
    findSchedulesByDoctorId: any;
    createSchedules: any;
  };

  beforeEach(() => {
    repository = {
      findManyWithSchedules: jest.fn(),
      countDoctors: jest.fn(),
      findDoctorByIdWithSchedules: jest.fn(),
      findDoctorByUniqueFields: jest.fn(),
      findOfficeById: jest.fn(),
      createDoctor: jest.fn(),
      findDoctorById: jest.fn(),
      findSchedulesByDoctorId: jest.fn(),
      createSchedules: jest.fn(),
    };

    service = new DoctorsService(repository as unknown as DoctorsRepository);
  });

  it('should return paginated doctors with metadata', async () => {
    repository.findManyWithSchedules.mockResolvedValue([
      { id: 1, firstName: 'Ana', lastName: 'Pérez' },
      { id: 2, firstName: 'Luis', lastName: 'García' },
    ]);
    repository.countDoctors.mockResolvedValue(15);

    const result = await service.findAll(2, 2);

    expect(repository.findManyWithSchedules).toHaveBeenCalledWith(2, 2);
    expect(result).toEqual({
      data: [
        { id: 1, firstName: 'Ana', lastName: 'Pérez' },
        { id: 2, firstName: 'Luis', lastName: 'García' },
      ],
      page: 2,
      limit: 2,
      total: 15,
      totalPages: 8,
    });
  });

  it('should serialize doctor schedule times as HH:mm strings', async () => {
    repository.findDoctorByIdWithSchedules.mockResolvedValue({
      id: 1,
      licenseNumber: 'ABC123',
      nationalId: '1234567890',
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@example.com',
      schedules: [
        {
          id: 10,
          doctorId: 1n,
          dayOfWeek: 'MONDAY',
          startTime: new Date('1970-01-01T08:00:00Z'),
          endTime: new Date('1970-01-01T09:00:00Z'),
          createdAt: new Date(),
        },
      ],
    });

    const result = await service.findOne(1);

    expect(result.schedules[0].startTime).toBe('08:00');
    expect(result.schedules[0].endTime).toBe('09:00');
  });

  it('should throw ConflictException when license or nationalId already exists', async () => {
    const dto: CreateDoctorDto = {
      licenseNumber: 'ABC123',
      nationalId: '1234567890',
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@example.com',
    };

    repository.findDoctorByUniqueFields.mockResolvedValue({ id: 1 });

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException when officeId does not exist', async () => {
    const dto: CreateDoctorDto = {
      licenseNumber: 'ABC123',
      nationalId: '1234567890',
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@example.com',
      officeId: 999,
    };

    repository.findDoctorByUniqueFields.mockResolvedValue(null);
    repository.findOfficeById.mockResolvedValue([{ '?column?': 1 }]);
    repository.createDoctor.mockRejectedValue({
      code: 'P2003',
      meta: { constraint: 'fk_doctors_office' },
    });

    await expect(service.create(dto)).rejects.toThrow(
      'The provided officeId does not exist.',
    );
  });

  it('should throw BadRequestException when schedule ranges overlap', async () => {
    repository.findDoctorById.mockResolvedValue({ id: 1 });
    repository.findSchedulesByDoctorId.mockResolvedValue([
      {
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '11:00',
      },
    ]);

    const dto: CreateDoctorSchedulesDto = {
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '12:00' },
      ],
    };

    await expect(service.createSchedules(1, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create schedules and return persisted detail', async () => {
    repository.findDoctorById.mockResolvedValue({ id: 1 });
    repository.findSchedulesByDoctorId.mockResolvedValue([]);
    repository.createSchedules.mockResolvedValue([
      {
        id: 10,
        doctorId: 1,
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '09:00',
      },
      {
        id: 11,
        doctorId: 1,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
      },
    ]);

    const dto: CreateDoctorSchedulesDto = {
      schedules: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '09:00' },
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00' },
      ],
    };

    const result = await service.createSchedules(1, dto);

    expect(repository.createSchedules).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: 10,
        doctorId: 1,
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '09:00',
      },
      {
        id: 11,
        doctorId: 1,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
      },
    ]);
  });
});
