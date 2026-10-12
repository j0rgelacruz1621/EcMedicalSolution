import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDoctorDto {
  @ApiPropertyOptional({ example: 'MPPS-12345' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'V-12345678' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'dra.perez@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0412-0000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Cardiología' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  @IsOptional()
  @IsNumber()
  officeId?: number | null;

  @ApiPropertyOptional({ example: 'J-12345678-9', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rif?: string;

  @ApiPropertyOptional({
    description: 'Número de colegiatura (C.M.).',
    example: 'CM-6789',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cmNumber?: string;

  @ApiPropertyOptional({ maxLength: 1500 })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Foto de perfil (URL o data URI en base64).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  photoUrl?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'URL de la imagen del membrete que encabeza los récipes del médico. Tiene prioridad sobre el membrete del centro médico.',
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  headerImageUrl?: string | null;
}
