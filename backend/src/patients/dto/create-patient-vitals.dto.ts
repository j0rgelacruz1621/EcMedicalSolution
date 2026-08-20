import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreatePatientVitalsDto {
  @IsOptional()
  @Matches(/^\d{2,3}\/\d{2,3}$/, {
    message:
      'bloodPressure must have the format "systolic/diastolic", e.g. "120/80".',
  })
  bloodPressure?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(250)
  heartRateBpm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}
