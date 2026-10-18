import { ApiProperty } from '@nestjs/swagger';
import { recipe_status_enum, recipe_version_type_enum } from '@prisma/client';
import {
  DocumentDoctorSummaryDto,
  DocumentFooterDto,
  DocumentHeaderDto,
  DocumentPatientSummaryDto,
} from '../../common/documents/document-response.dto';

// Clases solo para documentar en Swagger la forma de las respuestas del módulo.

export class RecipeMedicationResponseDto {
  @ApiProperty({ description: 'Nombre del fármaco.', example: 'Enalapril' })
  drug_name: string;

  @ApiProperty({
    description: 'Presentación o concentración.',
    type: String,
    nullable: true,
    example: '10 mg',
  })
  presentation: string | null;

  @ApiProperty({
    description: 'Dosis por toma.',
    type: String,
    nullable: true,
    example: '1 tableta',
  })
  dose: string | null;

  @ApiProperty({
    description: 'Frecuencia de administración.',
    type: String,
    nullable: true,
    example: 'Cada 12 horas',
  })
  frequency: string | null;

  @ApiProperty({
    description: 'Duración del tratamiento.',
    type: String,
    nullable: true,
    example: '7 días',
  })
  duration: string | null;
}

export class RecipeResponseDto {
  @ApiProperty({ description: 'id del récipe (de esta versión).', example: 20 })
  recipe_id: number;

  @ApiProperty({ description: 'id del paciente.', example: 1 })
  patient_id: number;

  @ApiProperty({ description: 'id del médico firmante.', example: 1 })
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
    example: '2026-07-13',
  })
  issue_date: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Membrete con el que se emitió el récipe.',
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
  })
  header_image_url: string | null;

  @ApiProperty({
    description: 'Medicamentos prescritos, en orden de impresión.',
    type: [RecipeMedicationResponseDto],
  })
  medications: RecipeMedicationResponseDto[];

  @ApiProperty({
    description: 'Indicaciones adicionales (máx. 500 caracteres).',
    type: String,
    nullable: true,
    example: 'Tomar abundante agua y mantener reposo relativo.',
  })
  additional_instructions: string | null;

  @ApiProperty({
    enum: recipe_status_enum,
    enumName: 'RecipeStatus',
    description:
      'ACTIVE: versión vigente. EDITED: reemplazada por una edición. CANCELLED: anulada.',
    example: recipe_status_enum.ACTIVE,
  })
  status: recipe_status_enum;

  @ApiProperty({
    enum: recipe_version_type_enum,
    enumName: 'RecipeVersionType',
    description:
      'ORIGINAL: versión vigente de la cadena. SUPERSEDED: versión anterior conservada para auditoría.',
    example: recipe_version_type_enum.ORIGINAL,
  })
  version_type: recipe_version_type_enum;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Versión anterior que este récipe reemplaza (si fue editado).',
    example: null,
  })
  supersedes_recipe_id: number | null;

  @ApiProperty({
    description: 'Fecha y hora de creación de esta versión.',
    format: 'date-time',
    example: '2026-07-13T14:30:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Fecha y hora de la última modificación.',
    format: 'date-time',
    example: '2026-07-13T14:30:00.000Z',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Resumen del paciente.',
    type: DocumentPatientSummaryDto,
  })
  patient: DocumentPatientSummaryDto;

  @ApiProperty({
    description: 'Resumen del médico firmante.',
    type: DocumentDoctorSummaryDto,
  })
  doctor: DocumentDoctorSummaryDto;
}

export class PaginatedRecipesResponseDto {
  @ApiProperty({
    description: 'Registros de la página actual.',
    type: [RecipeResponseDto],
  })
  data: RecipeResponseDto[];

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

export class RecipeDocumentResponseDto {
  @ApiProperty({
    description:
      'Cuerpo del documento: el récipe con paciente, fecha, medicamentos e indicaciones.',
    type: RecipeResponseDto,
  })
  recipe: RecipeResponseDto;

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
