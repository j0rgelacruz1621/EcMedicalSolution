import { ApiProperty } from '@nestjs/swagger';
import { recipe_status_enum, recipe_version_type_enum } from '@prisma/client';

// Clases solo para documentar en Swagger la forma de las respuestas del módulo.

export class RecipeMedicationResponseDto {
  @ApiProperty({ example: 'Enalapril' })
  drug_name: string;

  @ApiProperty({ type: String, nullable: true, example: '10 mg' })
  presentation: string | null;

  @ApiProperty({ type: String, nullable: true, example: '1 tableta' })
  dose: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Cada 12 horas' })
  frequency: string | null;

  @ApiProperty({ type: String, nullable: true, example: '7 días' })
  duration: string | null;
}

export class RecipePatientSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ricardo Mendoza' })
  full_name: string;

  @ApiProperty({ example: 'V-12345678' })
  national_id: string;

  @ApiProperty({ type: Number, nullable: true, example: 54 })
  age: number | null;
}

export class RecipeDoctorSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ana Pérez' })
  full_name: string;

  @ApiProperty({ type: String, nullable: true, example: 'Cardiología' })
  specialty: string | null;
}

export class RecipeResponseDto {
  @ApiProperty({ example: 20 })
  recipe_id: number;

  @ApiProperty({ example: 1 })
  patient_id: number;

  @ApiProperty({ example: 1 })
  doctor_id: number;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  medical_center_id: number | null;

  @ApiProperty({ type: Number, nullable: true, example: null })
  appointment_id: number | null;

  @ApiProperty({ format: 'date', example: '2026-07-13' })
  issue_date: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Membrete con el que se emitió el récipe.',
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
  })
  header_image_url: string | null;

  @ApiProperty({ type: [RecipeMedicationResponseDto] })
  medications: RecipeMedicationResponseDto[];

  @ApiProperty({
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

  @ApiProperty({ format: 'date-time', example: '2026-07-13T14:30:00.000Z' })
  created_at: string;

  @ApiProperty({ format: 'date-time', example: '2026-07-13T14:30:00.000Z' })
  updated_at: string;

  @ApiProperty({ type: RecipePatientSummaryDto })
  patient: RecipePatientSummaryDto;

  @ApiProperty({ type: RecipeDoctorSummaryDto })
  doctor: RecipeDoctorSummaryDto;
}

export class PaginatedRecipesResponseDto {
  @ApiProperty({ type: [RecipeResponseDto] })
  data: RecipeResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class RecipeDocumentHeaderDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Imagen del membrete: la guardada en el récipe, si no la del médico, si no la del centro médico. Si es null, el cliente muestra nombre y especialidad.',
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
  })
  image_url: string | null;

  @ApiProperty({ example: 'Ana Pérez' })
  doctor_name: string;

  @ApiProperty({ type: String, nullable: true, example: 'Cardiología' })
  specialty: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Centro Médico Caracas',
  })
  medical_center_name: string | null;
}

export class RecipeDocumentFooterDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Consultorio y dirección del centro médico.',
    example: 'Consultorio 12, Piso 2 · Av. Principal de Las Mercedes',
  })
  address: string | null;

  @ApiProperty({
    type: [String],
    description: 'Teléfono del médico y del centro médico (los que existan).',
    example: ['0412-0000000', '0212-0000000'],
  })
  phones: string[];

  @ApiProperty({ example: 'dra.perez@example.com' })
  email: string;

  @ApiProperty({
    description: 'Número de registro médico.',
    example: 'MPPS-12345',
  })
  license_number: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Número de colegiatura (C.M.).',
    example: 'CM-6789',
  })
  cm_number: string | null;
}

export class RecipeDocumentResponseDto {
  @ApiProperty({ type: RecipeResponseDto })
  recipe: RecipeResponseDto;

  @ApiProperty({ type: RecipeDocumentHeaderDto })
  header: RecipeDocumentHeaderDto;

  @ApiProperty({ type: RecipeDocumentFooterDto })
  footer: RecipeDocumentFooterDto;
}
