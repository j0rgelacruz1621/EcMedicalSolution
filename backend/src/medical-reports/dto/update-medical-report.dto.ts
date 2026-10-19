import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
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

export const MAX_REPORT_CONTENT_LENGTH = 20_000;
export const MAX_REST_DAYS = 365;

// CIE-10: letra + 2 dígitos, con subcategoría opcional (J06, J06.9, S72.001A).
// La cadena vacía se acepta para borrar el código al editar.
export const ICD10_PATTERN = /^([A-Z]\d{2}(\.[0-9A-Z]{1,4})?)?$/;

// Campos modificables (criterio 4.1). Tipo, paciente, médico y fecha de emisión
// no se modifican: para eso se anula el informe y se emite uno nuevo.
export class UpdateMedicalReportDto {
  @ApiPropertyOptional({
    description: 'Título o asunto del documento.',
    example: 'Informe de Reposo Médico',
    maxLength: 200,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Resumen breve o motivo general. Enviar "" para borrarlo.',
    example:
      'Reposo relativo por síndrome febril e infección respiratoria superior',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Cuerpo del informe: detalles médicos u observaciones.',
    example:
      'Se evalúa paciente con cuadro clínico de 48 horas de evolución. Se indica reposo físico absoluto en casa.',
    maxLength: MAX_REPORT_CONTENT_LENGTH,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_REPORT_CONTENT_LENGTH)
  content?: string;

  @ApiPropertyOptional({
    description:
      'Inicio del reposo (solo REPOSO_MEDICO). Si cambia sin enviar fin ni días, el período se desplaza conservando los días.',
    example: '2026-10-08',
    format: 'date',
  })
  @IsOptional()
  @IsDateOnly()
  rest_start_date?: string;

  @ApiPropertyOptional({
    description:
      'Último día de reposo, inclusive (solo REPOSO_MEDICO). Si se envía sin rest_days, los días se recalculan.',
    example: '2026-10-11',
    format: 'date',
  })
  @IsOptional()
  @IsDateOnly()
  rest_end_date?: string;

  @ApiPropertyOptional({
    description:
      'Días de reposo, contando inicio y fin (solo REPOSO_MEDICO). Si se envía sin rest_end_date, la fecha de fin se recalcula.',
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
    description:
      'Código CIE-10. Se normaliza a mayúsculas. Enviar "" para borrarlo.',
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
    description: 'Diagnóstico clínico justificativo. Enviar "" para borrarlo.',
    example: 'Infección aguda de las vías respiratorias superiores',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;
}
