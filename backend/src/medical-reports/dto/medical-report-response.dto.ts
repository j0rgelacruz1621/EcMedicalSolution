import { ApiProperty } from '@nestjs/swagger';
import {
  medical_report_status_enum,
  medical_report_type_enum,
} from '@prisma/client';
import {
  DocumentDoctorSummaryDto,
  DocumentFooterDto,
  DocumentHeaderDto,
  DocumentPatientSummaryDto,
} from '../../common/documents/document-response.dto';

// Clases solo para documentar en Swagger la forma de las respuestas del módulo.

export class MedicalReportResponseDto {
  @ApiProperty({ description: 'id del informe médico.', example: 15 })
  id: number;

  @ApiProperty({ description: 'id del paciente.', example: 1 })
  patient_id: number;

  @ApiProperty({ description: 'id del médico emisor.', example: 1 })
  doctor_id: number;

  @ApiProperty({
    description: 'id de la sede / centro médico.',
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
    description: 'Categoría del documento.',
    enum: medical_report_type_enum,
    enumName: 'MedicalReportType',
    example: medical_report_type_enum.REPOSO_MEDICO,
  })
  type: medical_report_type_enum;

  @ApiProperty({
    description: 'Título o asunto del documento.',
    example: 'Informe de Reposo Médico',
  })
  title: string;

  @ApiProperty({
    description: 'Resumen breve o motivo general.',
    type: String,
    nullable: true,
    example:
      'Reposo relativo por síndrome febril e infección respiratoria superior',
  })
  description: string | null;

  @ApiProperty({
    description: 'Cuerpo del informe: detalles médicos u observaciones.',
    example:
      'Se evalúa paciente con cuadro clínico de 48 horas de evolución. Se indica reposo físico absoluto en casa.',
  })
  content: string;

  @ApiProperty({
    description: 'Fecha de emisión (YYYY-MM-DD).',
    format: 'date',
    example: '2026-10-08',
  })
  issue_date: string;

  @ApiProperty({
    description: 'Inicio del reposo (solo REPOSO_MEDICO).',
    type: String,
    format: 'date',
    nullable: true,
    example: '2026-10-08',
  })
  rest_start_date: string | null;

  @ApiProperty({
    description: 'Último día de reposo, inclusive (solo REPOSO_MEDICO).',
    type: String,
    format: 'date',
    nullable: true,
    example: '2026-10-11',
  })
  rest_end_date: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Días de reposo contando inicio y fin.',
    example: 4,
  })
  rest_days: number | null;

  @ApiProperty({
    description: 'Código CIE-10.',
    type: String,
    nullable: true,
    example: 'J06.9',
  })
  diagnosis_code: string | null;

  @ApiProperty({
    description: 'Diagnóstico clínico justificativo.',
    type: String,
    nullable: true,
    example: 'Infección aguda de las vías respiratorias superiores',
  })
  diagnosis: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Membrete con el que se emitió el documento.',
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
  })
  header_image_url: string | null;

  @ApiProperty({
    enum: medical_report_status_enum,
    enumName: 'MedicalReportStatus',
    description:
      'ACTIVE: emitido. EDITED: modificado después de emitido. SIGNED: firmado (ya no se puede modificar). CANCELLED: anulado.',
    example: medical_report_status_enum.ACTIVE,
  })
  status: medical_report_status_enum;

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

export class PaginatedMedicalReportsResponseDto {
  @ApiProperty({
    description: 'Registros de la página actual.',
    type: [MedicalReportResponseDto],
  })
  data: MedicalReportResponseDto[];

  @ApiProperty({ description: 'Página actual.', example: 1 })
  page: number;

  @ApiProperty({ description: 'Registros por página.', example: 10 })
  limit: number;

  @ApiProperty({
    description: 'Total de registros que cumplen los filtros.',
    example: 1,
  })
  total: number;

  @ApiProperty({ description: 'Total de páginas.', example: 1 })
  totalPages: number;
}

export class MedicalReportDocumentResponseDto {
  @ApiProperty({
    description: 'Cuerpo del documento: el informe completo.',
    type: MedicalReportResponseDto,
  })
  medical_report: MedicalReportResponseDto;

  @ApiProperty({
    description: 'Encabezado: membrete del médico o del centro médico.',
    type: DocumentHeaderDto,
  })
  header: DocumentHeaderDto;

  @ApiProperty({
    description:
      'Pie: dirección, teléfonos, correo, registro médico y colegiatura para el bloque de firma y sello.',
    type: DocumentFooterDto,
  })
  footer: DocumentFooterDto;
}
