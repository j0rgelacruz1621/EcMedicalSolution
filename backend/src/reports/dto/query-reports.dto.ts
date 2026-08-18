import { report_status_enum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class QueryReportsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patient_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctor_id?: number;

  @IsOptional()
  @IsEnum(report_status_enum, {
    message: `status must be one of: ${Object.values(report_status_enum).join(', ')}`,
  })
  status?: report_status_enum;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
