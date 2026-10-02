import { PrismaService } from '../prisma/prisma.service';
import { PatientsRepository } from './patients.repository';

describe('PatientsRepository', () => {
  let repository: PatientsRepository;
  let prisma: {
    patient: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
  };

  const whereFor = async (
    filters: Parameters<PatientsRepository['findMany']>[0],
  ) => {
    await repository.findMany(filters, 0, 10);

    return (prisma.patient.findMany.mock.calls[0] as [{ where: unknown }])[0]
      .where;
  };

  beforeEach(() => {
    prisma = {
      patient: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    repository = new PatientsRepository(prisma as unknown as PrismaService);
  });

  it('orders by created_at DESC and applies the pagination window', async () => {
    await repository.findMany({}, 20, 10);

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 20,
      take: 10,
    });
  });

  it('filters by a partial national id', async () => {
    expect(await whereFor({ nationalId: '0912' })).toEqual({
      nationalId: { contains: '0912', mode: 'insensitive' },
    });
  });

  it('matches every search word against first_name or last_name', async () => {
    expect(await whereFor({ search: '  juan   perez ' })).toEqual({
      AND: [
        {
          OR: [
            { firstName: { contains: 'juan', mode: 'insensitive' } },
            { lastName: { contains: 'juan', mode: 'insensitive' } },
          ],
        },
        {
          OR: [
            { firstName: { contains: 'perez', mode: 'insensitive' } },
            { lastName: { contains: 'perez', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('ignores a search made only of whitespace', async () => {
    expect(await whereFor({ search: '   ' })).toEqual({});
  });

  it.each([true, false])('filters by isActive = %p', async (isActive) => {
    expect(await whereFor({ isActive })).toEqual({ isActive });
  });

  it('combines search and doctor filters without one overriding the other', async () => {
    expect(await whereFor({ search: 'juan', doctorId: 7n })).toEqual({
      AND: [
        {
          OR: [
            { firstName: { contains: 'juan', mode: 'insensitive' } },
            { lastName: { contains: 'juan', mode: 'insensitive' } },
          ],
        },
        {
          OR: [
            { assignedDoctorId: 7n },
            { appointments: { some: { doctorId: 7n } } },
          ],
        },
      ],
    });
  });

  it('counts with the same filters used for the listing', async () => {
    await repository.count({ isActive: true, nationalId: '09' });

    expect(prisma.patient.count).toHaveBeenCalledWith({
      where: {
        isActive: true,
        nationalId: { contains: '09', mode: 'insensitive' },
      },
    });
  });

  it('looks an email up case-insensitively', async () => {
    await repository.findByEmail('Maria@Example.com');

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Maria@Example.com', mode: 'insensitive' } },
    });
  });

  it('excludes the current patient when checking an email on update', async () => {
    await repository.findByEmail('maria@example.com', 1n);

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: {
        email: { equals: 'maria@example.com', mode: 'insensitive' },
        id: { not: 1n },
      },
    });
  });
});
