import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
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

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(PatientGender, {
    message: 'gender must be MASCULINO, FEMENINO or OTRO.',
  })
  gender: PatientGender;

  @IsOptional()
  @IsString()
  medicalHistoryNotes?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreatePatientVitalsDto)
  vitals: CreatePatientVitalsDto;
}
