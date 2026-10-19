import { ApiPropertyOptional } from '@nestjs/swagger';
import { medical_report_type_enum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

export class QueryMedicalReportsDto {
  @ApiPropertyOptional({
    description: 'Fecha de emisión desde (inclusive).',
    example: '2026-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateOnly()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de emisión hasta (inclusive).',
    example: '2026-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateOnly()
  endDate?: string;

  @ApiPropertyOptional({
    enum: medical_report_type_enum,
    enumName: 'MedicalReportType',
    description: 'Filtrar por tipo de documento.',
  })
  @IsOptional()
  @IsEnum(medical_report_type_enum, {
    message: `type must be one of: ${Object.values(medical_report_type_enum).join(', ')}`,
  })
  type?: medical_report_type_enum;

  @ApiPropertyOptional({
    description: 'Página (desde 1).',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Registros por página.',
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
