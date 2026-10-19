import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { medical_report_type_enum } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';
import {
  ICD10_PATTERN,
  MAX_REPORT_CONTENT_LENGTH,
  MAX_REST_DAYS,
} from './update-medical-report.dto';

export class CreateMedicalReportDto {
  @ApiProperty({ description: 'Paciente.', example: 1 })
  @IsInt()
  @Min(1)
  patient_id: number;

  @ApiProperty({
    description:
      'Médico emisor. Un médico (rol DOCTOR) solo puede enviar su propio id; una cuenta SA puede emitir por cualquier médico.',
    example: 1,
  })
  @IsInt()
  @Min(1)
  doctor_id: number;

  @ApiPropertyOptional({
    description:
      'Sede / centro médico. Si se omite, se toma del consultorio asignado al médico.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  medical_center_id?: number;

  @ApiPropertyOptional({
    description: 'Cita asociada. Debe pertenecer al mismo paciente.',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  appointment_id?: number;

  @ApiPropertyOptional({
    enum: medical_report_type_enum,
    enumName: 'MedicalReportType',
    description: 'Categoría del documento.',
    default: medical_report_type_enum.INFORME_MEDICO,
    example: medical_report_type_enum.REPOSO_MEDICO,
  })
  @IsOptional()
  @IsEnum(medical_report_type_enum, {
    message: `type must be one of: ${Object.values(medical_report_type_enum).join(', ')}`,
  })
  type?: medical_report_type_enum;

  @ApiProperty({
    description: 'Título o asunto del documento.',
    example: 'Informe de Reposo Médico',
    maxLength: 200,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Resumen breve o motivo general.',
    example:
      'Reposo relativo por síndrome febril e infección respiratoria superior',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Cuerpo del informe: detalles médicos u observaciones.',
    example:
      'Se evalúa paciente con cuadro clínico de 48 horas de evolución. Se indica reposo físico absoluto en casa, aislamiento preventivo y cumplimiento de tratamiento farmacológico prescrito.',
    maxLength: MAX_REPORT_CONTENT_LENGTH,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_REPORT_CONTENT_LENGTH)
  content: string;

  @ApiProperty({
    description: 'Fecha de emisión (YYYY-MM-DD).',
    example: '2026-10-08',
    format: 'date',
  })
  @IsDateOnly()
  issue_date: string;

  @ApiPropertyOptional({
    description:
      'Inicio del reposo. Obligatorio para REPOSO_MEDICO; no se admite en otros tipos.',
    example: '2026-10-08',
    format: 'date',
  })
  @IsOptional()
  @IsDateOnly()
  rest_start_date?: string;

  @ApiPropertyOptional({
    description:
      'Último día de reposo, inclusive. Para REPOSO_MEDICO se requiere rest_end_date o rest_days (o ambos, coherentes).',
    example: '2026-10-11',
    format: 'date',
  })
  @IsOptional()
  @IsDateOnly()
  rest_end_date?: string;

  @ApiPropertyOptional({
    description:
      'Días de reposo contando inicio y fin (08→11 = 4 días). Si se envía junto a rest_end_date debe coincidir; si se omite se calcula.',
    example: 4,
    minimum: 1,
    maximum: MAX_REST_DAYS,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_REST_DAYS)
  rest_days?: number;

  @ApiPropertyOptional({
    description: 'Código CIE-10. Se normaliza a mayúsculas.',
    example: 'J06.9',
    maxLength: 20,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(ICD10_PATTERN, {
    message: 'diagnosis_code must be a valid ICD-10 code (e.g. J06.9).',
  })
  @MaxLength(20)
  diagnosis_code?: string;

  @ApiPropertyOptional({
    description: 'Diagnóstico clínico justificativo.',
    example: 'Infección aguda de las vías respiratorias superiores',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;
}
