import { appointment_status_enum } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  appointment_date?: string;

  @IsOptional()
  @Matches(TIME_PATTERN, {
    message: 'start_time must be in HH:mm:ss format.',
  })
  start_time?: string;

  @IsOptional()
  @Matches(TIME_PATTERN, {
    message: 'end_time must be in HH:mm:ss format.',
  })
  end_time?: string;

  @IsOptional()
  @IsEnum(appointment_status_enum, {
    message: `status must be one of: ${Object.values(appointment_status_enum).join(', ')}`,
  })
  status?: appointment_status_enum;

  @IsOptional()
  @IsInt()
  @Min(1)
  office_id?: number;
}
