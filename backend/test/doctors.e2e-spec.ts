import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { DoctorsModule } from '../src/doctors/doctors.module';

describe('Doctors endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: {
    doctor: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    doctorSchedule: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      doctor: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      doctorSchedule: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((queries: Array<Promise<unknown>>) => Promise.all(queries)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DoctorsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /doctors should return 201 when payload is valid', async () => {
    prismaMock.doctor.findFirst.mockResolvedValue(null);
    prismaMock.doctor.create.mockResolvedValue({
      id: 1,
      licenseNumber: 'LIC-001',
      nationalId: 'NID-001',
      firstName: 'Ana',
      lastName: 'Lopez',
      email: 'ana.lopez@example.com',
      phone: '5551111',
      specialty: 'Cardiology',
      officeId: 2,
    });

    const payload = {
      licenseNumber: 'LIC-001',
      nationalId: 'NID-001',
      firstName: 'Ana',
      lastName: 'Lopez',
      email: 'ana.lopez@example.com',
      phone: '5551111',
      specialty: 'Cardiology',
      officeId: 2,
    };

    const response = await request(app.getHttpServer())
      .post('/doctors')
      .send(payload)
      .expect(201);

    expect(response.body.id).toBe(1);
    expect(response.body.licenseNumber).toBe('LIC-001');
  });

  it('POST /doctors should return 409 when doctor already exists', async () => {
    prismaMock.doctor.findFirst.mockResolvedValue({ id: 99 });

    await request(app.getHttpServer())
      .post('/doctors')
      .send({
        licenseNumber: 'LIC-EXISTS',
        nationalId: 'NID-EXISTS',
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana.exists@example.com',
      })
      .expect(409);
  });

  it('POST /doctors should return 400 when payload is invalid', async () => {
    await request(app.getHttpServer())
      .post('/doctors')
      .send({
        licenseNumber: '',
        nationalId: 'NID-002',
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'invalid-email',
      })
      .expect(400);
  });

  it('POST /doctors/:id/schedules should return 201 with persisted detail', async () => {
    prismaMock.doctor.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.doctorSchedule.findMany.mockResolvedValue([]);
    prismaMock.doctorSchedule.create
      .mockResolvedValueOnce({
        id: 10,
        doctorId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '09:00',
      })
      .mockResolvedValueOnce({
        id: 11,
        doctorId: 1,
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '11:00',
      });

    const response = await request(app.getHttpServer())
      .post('/doctors/1/schedules')
      .send({
        schedules: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '09:00' },
          { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
        ],
      })
      .expect(201);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(10);
    expect(response.body[1].id).toBe(11);
  });

  it('POST /doctors/:id/schedules should return 400 when startTime >= endTime', async () => {
    prismaMock.doctor.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.doctorSchedule.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .post('/doctors/1/schedules')
      .send({
        schedules: [{ dayOfWeek: 1, startTime: '12:00', endTime: '10:00' }],
      })
      .expect(400);
  });

  it('POST /doctors/:id/schedules should return 400 when schedules array is empty', async () => {
    await request(app.getHttpServer())
      .post('/doctors/1/schedules')
      .send({ schedules: [] })
      .expect(400);
  });
});
