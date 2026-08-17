import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PatientGender {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  OTRO = 'OTRO',
}

export class PatientDataDto {
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
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
}

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  doctorId: number;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @Min(1)
  medicalCenterId: number;

  @IsInt()
  @Min(1)
  officeId: number;

  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @ValidateNested()
  @Type(() => PatientDataDto)
  patient: PatientDataDto;
}

export class UpdateAppointmentScheduleDto {
  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
