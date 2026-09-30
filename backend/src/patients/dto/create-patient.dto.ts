import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreatePatientVitalsDto } from './create-patient-vitals.dto';

export enum PatientGender {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  OTRO = 'OTRO',
}

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsInt()
  assignedDoctorId?: number;

  @IsEnum(PatientGender, {
    message: 'gender must be MASCULINO, FEMENINO or OTRO.',
  })
  gender: PatientGender;

  @IsOptional()
  @IsString()
  medicalHistoryNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientVitalsDto)
  vitals?: CreatePatientVitalsDto;
}
