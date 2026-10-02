import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';
import { CreatePatientVitalsDto } from './create-patient-vitals.dto';
import { PatientGender } from './create-patient.dto';

// Para columnas NOT NULL: el campo puede omitirse, pero si se envía (incluso
// como null) se valida. @IsOptional dejaría pasar null hasta la BD.
const IfSent = () => ValidateIf((_, value) => value !== undefined);

export class UpdatePatientDto {
  @IfSent()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nationalId?: string;

  @IfSent()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @IfSent()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @IfSent()
  @Trim()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IfSent()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;

  @IfSent()
  @IsEnum(PatientGender, {
    message: 'gender must be MASCULINO, FEMENINO or OTRO.',
  })
  gender?: PatientGender;

  @IfSent()
  @IsBoolean()
  isActive?: boolean;

  // Los campos siguientes son columnas NULLABLE: enviar null borra el valor.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  assignedDoctorId?: number | null;

  @IsOptional()
  @IsString()
  medicalHistoryNotes?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientVitalsDto)
  vitals?: CreatePatientVitalsDto;
}
