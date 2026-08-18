import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @IsInt()
  @Min(1)
  patient_id: number;

  @IsInt()
  @Min(1)
  doctor_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  appointment_id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}
