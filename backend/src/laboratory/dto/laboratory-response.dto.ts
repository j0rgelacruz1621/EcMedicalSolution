import { ApiProperty } from '@nestjs/swagger';
import {
  DocumentDoctorSummaryDto,
  DocumentPatientSummaryDto,
} from '../../common/documents/document-response.dto';
import { ORDER_STATUSES } from '../laboratory-orders.repository';

// Clases solo para documentar en Swagger la forma de las respuestas del módulo.

export class LaboratoryTestResponseDto {
  @ApiProperty({ description: 'id del examen.', example: 3 })
  test_id: number;

  @ApiProperty({ description: 'Categoría del examen.', example: 1 })
  category_id: number;

  @ApiProperty({
    description: 'Código interno.',
    type: String,
    nullable: true,
    example: 'HEM-01',
  })
  internal_code: string | null;

  @ApiProperty({
    description: 'Nombre del examen.',
    example: 'Hematología Completa',
  })
  name: string;

  @ApiProperty({
    description: 'Código LOINC.',
    type: String,
    nullable: true,
    example: '58410-2',
  })
  loinc_code: string | null;

  @ApiProperty({
    description: 'Si está disponible para nuevas órdenes.',
    example: true,
  })
  is_active: boolean;
}

export class LaboratoryCategoryResponseDto {
  @ApiProperty({ description: 'id de la categoría.', example: 1 })
  category_id: number;

  @ApiProperty({
    description: 'Nombre de la categoría.',
    example: 'Hematología',
  })
  name: string;

  @ApiProperty({
    description: 'Descripción de la categoría.',
    type: String,
    nullable: true,
    example: 'Estudios de las células sanguíneas y la coagulación.',
  })
  description: string | null;

  @ApiProperty({
    description: 'Si está disponible para nuevas órdenes.',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description:
      'Exámenes de la categoría (solo activos, salvo con include_inactive=true).',
    type: [LaboratoryTestResponseDto],
  })
  tests: LaboratoryTestResponseDto[];
}

export class LaboratoryOrderTestResponseDto {
  @ApiProperty({ description: 'id del examen del catálogo.', example: 3 })
  test_id: number;

  @ApiProperty({ description: 'id de la categoría del examen.', example: 1 })
  category_id: number;

  @ApiProperty({
    description: 'Nombre de la categoría (sección).',
    example: 'Hematología',
  })
  category_name: string;

  @ApiProperty({
    description: 'Código interno.',
    type: String,
    nullable: true,
    example: 'HEM-01',
  })
  internal_code: string | null;

  @ApiProperty({
    description: 'Nombre del examen.',
    example: 'Hematología Completa',
  })
  name: string;

  @ApiProperty({
    description: 'Código LOINC.',
    type: String,
    nullable: true,
    example: '58410-2',
  })
  loinc_code: string | null;
}

export class LaboratoryOrderCustomTestResponseDto {
  @ApiProperty({
    description: 'Sección indicada para el examen personalizado.',
    type: String,
    nullable: true,
    example: 'Inmunología',
  })
  category_name: string | null;

  @ApiProperty({
    description: 'Nombre del examen no catalogado.',
    example: 'Antígeno específico no catalogado',
  })
  test_name: string;
}

export class LaboratoryOrderResponseDto {
  @ApiProperty({ description: 'id de la orden.', example: 12 })
  id: number;

  @ApiProperty({ description: 'id del paciente.', example: 1 })
  patient_id: number;

  @ApiProperty({ description: 'id del médico emisor.', example: 1 })
  doctor_id: number;

  @ApiProperty({
    description: 'id del centro médico.',
    type: Number,
    nullable: true,
    example: 1,
  })
  medical_center_id: number | null;

  @ApiProperty({
    description: 'id de la cita asociada, si la hay.',
    type: Number,
    nullable: true,
    example: null,
  })
  appointment_id: number | null;

  @ApiProperty({
    description: 'Fecha de emisión (YYYY-MM-DD).',
    format: 'date',
    example: '2026-10-08',
  })
  issue_date: string;

  @ApiProperty({
    description: 'Diagnóstico o motivo de la solicitud.',
    type: String,
    nullable: true,
    example: 'Evaluación preventiva anual',
  })
  diagnosis: string | null;

  @ApiProperty({
    description: 'Instrucciones pre-analíticas / notas de preparación.',
    type: String,
    nullable: true,
    example: 'Ayunar mínimo 8 a 12 horas.',
  })
  additional_notes: string | null;

  @ApiProperty({
    description: 'Membrete con el que se emitió la orden.',
    type: String,
    nullable: true,
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
  })
  header_image_url: string | null;

  @ApiProperty({
    description:
      'ACTIVE: emitida. EDITED: modificada. SIGNED: firmada (ya no se modifica). CANCELLED: anulada.',
    enum: ORDER_STATUSES,
    enumName: 'LaboratoryOrderStatus',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Exámenes del catálogo, en orden.',
    type: [LaboratoryOrderTestResponseDto],
  })
  tests: LaboratoryOrderTestResponseDto[];

  @ApiProperty({
    description: 'Exámenes personalizados, en orden.',
    type: [LaboratoryOrderCustomTestResponseDto],
  })
  custom_tests: LaboratoryOrderCustomTestResponseDto[];

  @ApiProperty({
    description: 'Fecha y hora de creación.',
    format: 'date-time',
    example: '2026-10-08T14:30:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Fecha y hora de la última modificación o cambio de estado.',
    format: 'date-time',
    example: '2026-10-08T14:30:00.000Z',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Resumen del paciente.',
    type: DocumentPatientSummaryDto,
  })
  patient: DocumentPatientSummaryDto;

  @ApiProperty({
    description: 'Resumen del médico emisor.',
    type: DocumentDoctorSummaryDto,
  })
  doctor: DocumentDoctorSummaryDto;
}

export class PaginatedLaboratoryOrdersResponseDto {
  @ApiProperty({
    description:
      'Órdenes de la página actual, de la más reciente a la más antigua.',
    type: [LaboratoryOrderResponseDto],
  })
  data: LaboratoryOrderResponseDto[];

  @ApiProperty({ description: 'Página actual.', example: 1 })
  page: number;

  @ApiProperty({ description: 'Registros por página.', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de órdenes del paciente.', example: 2 })
  total: number;

  @ApiProperty({ description: 'Total de páginas.', example: 1 })
  totalPages: number;
}
