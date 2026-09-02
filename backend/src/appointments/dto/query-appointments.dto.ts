import { appointment_status_enum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class QueryAppointmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctor_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medical_center_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patient_id?: number;

  @IsOptional()
  @IsEnum(appointment_status_enum, {
    message: `status must be one of: ${Object.values(appointment_status_enum).join(', ')}`,
  })
  status?: appointment_status_enum;

  @IsOptional()
  @IsDateString()
  appointment_date?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

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
