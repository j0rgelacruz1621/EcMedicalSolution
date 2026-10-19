import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  documentDoctorSelect,
  documentMedicalCenterSelect,
  documentPatientSelect,
} from '../common/documents/printable-document';
import { PrismaService } from '../prisma/prisma.service';

export const laboratoryOrderInclude = {
  patient: { select: documentPatientSelect },
  doctor: { select: documentDoctorSelect },
  medicalCenter: { select: documentMedicalCenterSelect },
  catalogTests: {
    orderBy: { sortOrder: 'asc' },
    include: {
      test: {
        select: { id: true, internalCode: true, name: true, loincCode: true },
      },
      category: { select: { id: true, name: true } },
    },
  },
  customTests: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.LaboratoryOrderInclude;

export type LaboratoryOrderWithRelations = Prisma.LaboratoryOrderGetPayload<{
  include: typeof laboratoryOrderInclude;
}>;

export const ORDER_STATUSES = [
  'ACTIVE',
  'EDITED',
  'SIGNED',
  'CANCELLED',
] as const;
export type LaboratoryOrderStatus = (typeof ORDER_STATUSES)[number];

// Estados en los que la orden todavía puede modificarse o firmarse.
export const OPEN_ORDER_STATUSES: LaboratoryOrderStatus[] = [
  'ACTIVE',
  'EDITED',
];

export interface OrderItems {
  tests: { testId: bigint; categoryId: bigint }[];
  customTests: { categoryName: string | null; testName: string }[];
}

function toItemRows(items: OrderItems) {
  return {
    catalogTests: items.tests.map((item, index) => ({
      testId: item.testId,
      categoryId: item.categoryId,
      sortOrder: index,
    })),
    customTests: items.customTests.map((item, index) => ({
      categoryName: item.categoryName,
      testName: item.testName,
      sortOrder: index,
    })),
  };
}

@Injectable()
export class LaboratoryOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPatientById(id: bigint) {
    return this.prisma.patient.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findDoctorById(id: bigint) {
    return this.prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        headerImageUrl: true,
        office: { select: { medicalCenterId: true } },
      },
    });
  }

  findMedicalCenterById(id: bigint) {
    return this.prisma.medicalCenter.findUnique({
      where: { id },
      select: { id: true, headerImageUrl: true },
    });
  }

  findAppointmentById(id: bigint) {
    return this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true, patientId: true },
    });
  }

  findTestsByIds(ids: bigint[]) {
    return this.prisma.laboratoryTest.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        categoryId: true,
        isActive: true,
        name: true,
        category: { select: { isActive: true } },
      },
    });
  }

  create(
    data: Omit<
      Prisma.LaboratoryOrderUncheckedCreateInput,
      'catalogTests' | 'customTests'
    >,
    items: OrderItems,
  ) {
    const rows = toItemRows(items);

    return this.prisma.laboratoryOrder.create({
      data: {
        ...data,
        catalogTests: { create: rows.catalogTests },
        customTests: { create: rows.customTests },
      },
      include: laboratoryOrderInclude,
    });
  }

  findById(id: bigint) {
    return this.prisma.laboratoryOrder.findUnique({
      where: { id },
      include: laboratoryOrderInclude,
    });
  }

  findManyByPatient(patientId: bigint, skip: number, take: number) {
    return this.prisma.laboratoryOrder.findMany({
      where: { patientId },
      include: laboratoryOrderInclude,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    });
  }

  countByPatient(patientId: bigint) {
    return this.prisma.laboratoryOrder.count({ where: { patientId } });
  }

  // Actualiza la orden (y reemplaza las listas de exámenes enviadas) solo si
  // sigue en uno de los estados esperados; así una firma o anulación simultánea
  // no se pisa. Devuelve null si no se actualizó nada.
  update(
    id: bigint,
    expectedStatuses: LaboratoryOrderStatus[],
    data: Prisma.LaboratoryOrderUncheckedUpdateInput,
    items: Partial<OrderItems> = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.laboratoryOrder.updateMany({
        where: { id, status: { in: expectedStatuses } },
        data,
      });

      if (count === 0) {
        return null;
      }

      const rows = toItemRows({
        tests: items.tests ?? [],
        customTests: items.customTests ?? [],
      });

      if (items.tests) {
        await tx.laboratoryOrderTest.deleteMany({ where: { orderId: id } });
        await tx.laboratoryOrderTest.createMany({
          data: rows.catalogTests.map((row) => ({ ...row, orderId: id })),
        });
      }

      if (items.customTests) {
        await tx.laboratoryOrderCustomTest.deleteMany({
          where: { orderId: id },
        });
        await tx.laboratoryOrderCustomTest.createMany({
          data: rows.customTests.map((row) => ({ ...row, orderId: id })),
        });
      }

      return tx.laboratoryOrder.findUnique({
        where: { id },
        include: laboratoryOrderInclude,
      });
    });
  }
}
