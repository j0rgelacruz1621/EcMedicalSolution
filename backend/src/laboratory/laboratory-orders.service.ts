import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestUser } from '../auth/current-user.decorator';
import {
  parseDateOnly,
  resolveLetterhead,
  toDateOnly,
  toDoctorSummary,
  toPatientSummary,
} from '../common/documents/printable-document';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateLaboratoryOrderDto } from './dto/create-laboratory-order.dto';
import {
  OrderCatalogTestDto,
  OrderCustomTestDto,
} from './dto/laboratory-order-items.dto';
import { QueryLaboratoryOrdersDto } from './dto/query-laboratory-orders.dto';
import { UpdateLaboratoryOrderDto } from './dto/update-laboratory-order.dto';
import {
  LaboratoryOrderStatus,
  LaboratoryOrdersRepository,
  LaboratoryOrderWithRelations,
  OPEN_ORDER_STATUSES,
  OrderItems,
} from './laboratory-orders.repository';

export function toLaboratoryOrderResponse(order: LaboratoryOrderWithRelations) {
  return {
    id: Number(order.id),
    patient_id: Number(order.patientId),
    doctor_id: Number(order.doctorId),
    medical_center_id: order.medicalCenterId
      ? Number(order.medicalCenterId)
      : null,
    appointment_id: order.appointmentId ? Number(order.appointmentId) : null,
    issue_date: toDateOnly(order.issueDate),
    diagnosis: order.diagnosis,
    additional_notes: order.additionalNotes,
    header_image_url: order.headerImageUrl,
    status: order.status as LaboratoryOrderStatus,
    tests: order.catalogTests.map((item) => ({
      test_id: Number(item.testId),
      category_id: Number(item.categoryId),
      category_name: item.category.name,
      internal_code: item.test.internalCode,
      name: item.test.name,
      loinc_code: item.test.loincCode,
    })),
    custom_tests: order.customTests.map((item) => ({
      category_name: item.categoryName,
      test_name: item.testName,
    })),
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
    patient: toPatientSummary(order.patient),
    doctor: toDoctorSummary(order.doctor),
  };
}

function toCustomItems(items: OrderCustomTestDto[]) {
  return items.map((item) => ({
    categoryName: item.category_name || null,
    testName: item.test_name,
  }));
}

@Injectable()
export class LaboratoryOrdersService {
  constructor(private readonly ordersRepository: LaboratoryOrdersRepository) {}

  // SA accounts can act on behalf of any doctor; a doctor only with the
  // doctorId claim from their own JWT.
  private assertActsAsDoctor(doctorId: number, user: RequestUser) {
    if (user.rol === 'SA') {
      return;
    }

    if (!user.doctorId || user.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only manage laboratory orders issued by yourself.',
      );
    }
  }

  async getOrderOrFail(id: number) {
    const order = await this.ordersRepository.findById(BigInt(id));

    if (!order) {
      throw new NotFoundException('Laboratory order not found.');
    }

    return order;
  }

  // Valida los exámenes del catálogo: que existan, que category_id sea su
  // categoría real y que estén activos. Los que ya estaban en la orden se
  // aceptan aunque luego se hayan desactivado, para poder editarla.
  private async validateCatalogTests(
    items: OrderCatalogTestDto[],
    alreadyInOrder: Set<bigint> = new Set(),
  ) {
    const ids = items.map((item) => BigInt(item.test_id));

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('tests contains a duplicated test_id.');
    }

    if (ids.length === 0) {
      return [];
    }

    const found = await this.ordersRepository.findTestsByIds(ids);
    const byId = new Map(found.map((test) => [test.id, test]));

    return items.map((item) => {
      const testId = BigInt(item.test_id);
      const test = byId.get(testId);

      if (!test) {
        throw new BadRequestException(
          `test_id ${item.test_id} does not exist.`,
        );
      }

      if (test.categoryId !== BigInt(item.category_id)) {
        throw new BadRequestException(
          `test_id ${item.test_id} belongs to category_id ${test.categoryId}, not ${item.category_id}.`,
        );
      }

      if (
        (!test.isActive || !test.category.isActive) &&
        !alreadyInOrder.has(testId)
      ) {
        throw new BadRequestException(
          `test_id ${item.test_id} (${test.name}) is inactive and cannot be ordered.`,
        );
      }

      return { testId, categoryId: test.categoryId };
    });
  }

  private assertHasItems(testCount: number, customTestCount: number) {
    if (testCount + customTestCount === 0) {
      throw new BadRequestException(
        'A laboratory order requires at least one item in tests or custom_tests.',
      );
    }
  }

  async create(payload: CreateLaboratoryOrderDto, user: RequestUser) {
    this.assertActsAsDoctor(payload.doctor_id, user);

    this.assertHasItems(
      payload.tests?.length ?? 0,
      payload.custom_tests?.length ?? 0,
    );

    const [patient, doctor, appointment, catalogTests] = await Promise.all([
      this.ordersRepository.findPatientById(BigInt(payload.patient_id)),
      this.ordersRepository.findDoctorById(BigInt(payload.doctor_id)),
      payload.appointment_id
        ? this.ordersRepository.findAppointmentById(
            BigInt(payload.appointment_id),
          )
        : Promise.resolve(null),
      this.validateCatalogTests(payload.tests ?? []),
    ]);

    if (!patient) {
      throw new BadRequestException('The provided patient_id does not exist.');
    }

    if (!doctor) {
      throw new BadRequestException('The provided doctor_id does not exist.');
    }

    if (payload.appointment_id) {
      if (!appointment) {
        throw new BadRequestException(
          'The provided appointment_id does not exist.',
        );
      }

      if (appointment.patientId !== patient.id) {
        throw new BadRequestException(
          'The appointment does not belong to the provided patient.',
        );
      }
    }

    const medicalCenterId = payload.medical_center_id
      ? BigInt(payload.medical_center_id)
      : (doctor.office?.medicalCenterId ?? null);

    const medicalCenter = medicalCenterId
      ? await this.ordersRepository.findMedicalCenterById(medicalCenterId)
      : null;

    if (payload.medical_center_id && !medicalCenter) {
      throw new BadRequestException(
        'The provided medical_center_id does not exist.',
      );
    }

    const order = await this.ordersRepository.create(
      {
        patientId: patient.id,
        doctorId: doctor.id,
        medicalCenterId: medicalCenter?.id ?? null,
        appointmentId: appointment?.id ?? null,
        issueDate: parseDateOnly(payload.issue_date),
        diagnosis: payload.diagnosis || null,
        additionalNotes: payload.additional_notes || null,
        // Copia del membrete vigente: las reimpresiones conservan el original.
        headerImageUrl: resolveLetterhead(doctor, medicalCenter),
        status: 'ACTIVE',
      },
      {
        tests: catalogTests,
        customTests: toCustomItems(payload.custom_tests ?? []),
      },
    );

    return toLaboratoryOrderResponse(order);
  }

  async findByPatient(patientId: number, query: QueryLaboratoryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const patient = await this.ordersRepository.findPatientById(
      BigInt(patientId),
    );

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const [orders, total] = await Promise.all([
      this.ordersRepository.findManyByPatient(
        patient.id,
        (page - 1) * limit,
        limit,
      ),
      this.ordersRepository.countByPatient(patient.id),
    ]);

    return new PaginatedResponseDto(
      orders.map(toLaboratoryOrderResponse),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    return toLaboratoryOrderResponse(await this.getOrderOrFail(id));
  }

  async update(
    id: number,
    payload: UpdateLaboratoryOrderDto,
    user: RequestUser,
  ) {
    if (Object.values(payload).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update were provided.');
    }

    const current = await this.getOrderOrFail(id);
    this.assertActsAsDoctor(Number(current.doctorId), user);

    if (
      !OPEN_ORDER_STATUSES.includes(current.status as LaboratoryOrderStatus)
    ) {
      throw new ConflictException(
        `A ${current.status} laboratory order cannot be modified.`,
      );
    }

    const changes: Partial<OrderItems> = {};

    if (payload.tests !== undefined) {
      changes.tests = await this.validateCatalogTests(
        payload.tests,
        new Set(current.catalogTests.map((item) => item.testId)),
      );
    }

    if (payload.custom_tests !== undefined) {
      changes.customTests = toCustomItems(payload.custom_tests);
    }

    this.assertHasItems(
      (changes.tests ?? current.catalogTests).length,
      (changes.customTests ?? current.customTests).length,
    );

    const data: Prisma.LaboratoryOrderUncheckedUpdateInput = {
      status: 'EDITED',
    };

    if (payload.diagnosis !== undefined) {
      data.diagnosis = payload.diagnosis || null;
    }

    if (payload.additional_notes !== undefined) {
      data.additionalNotes = payload.additional_notes || null;
    }

    const updated = await this.ordersRepository.update(
      current.id,
      OPEN_ORDER_STATUSES,
      data,
      changes,
    );

    if (!updated) {
      throw new ConflictException(
        'The laboratory order was signed or cancelled by another request. Reload and try again.',
      );
    }

    return toLaboratoryOrderResponse(updated);
  }

  sign(id: number, user: RequestUser) {
    return this.changeStatus(id, user, 'SIGNED', OPEN_ORDER_STATUSES, 'signed');
  }

  cancel(id: number, user: RequestUser) {
    return this.changeStatus(
      id,
      user,
      'CANCELLED',
      [...OPEN_ORDER_STATUSES, 'SIGNED'],
      'cancelled',
    );
  }

  private async changeStatus(
    id: number,
    user: RequestUser,
    status: LaboratoryOrderStatus,
    allowedFrom: LaboratoryOrderStatus[],
    action: string,
  ) {
    const current = await this.getOrderOrFail(id);
    this.assertActsAsDoctor(Number(current.doctorId), user);

    if (!allowedFrom.includes(current.status as LaboratoryOrderStatus)) {
      throw new ConflictException(
        `A ${current.status} laboratory order cannot be ${action}.`,
      );
    }

    const updated = await this.ordersRepository.update(
      current.id,
      allowedFrom,
      { status },
    );

    if (!updated) {
      throw new ConflictException(
        'The laboratory order changed status in another request. Reload and try again.',
      );
    }

    return toLaboratoryOrderResponse(updated);
  }
}
