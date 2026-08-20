import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePatientVitalsDto } from './create-patient-vitals.dto';
import { PatientGender } from './create-patient.dto';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(PatientGender, {
    message: 'gender must be MASCULINO, FEMENINO or OTRO.',
  })
  gender?: PatientGender;

  @IsOptional()
  @IsString()
  medicalHistoryNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientVitalsDto)
  vitals?: CreatePatientVitalsDto;
}
