import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

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

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  officeId?: number;

  @IsOptional()
  @IsEnum(['MASCULINO', 'FEMENINO', 'OTRO'], {
    message: 'gender must be MASCULINO, FEMENINO or OTRO.',
  })
  gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rif?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cmNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  photoUrl?: string;
}
