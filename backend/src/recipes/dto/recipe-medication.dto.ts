import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class RecipeMedicationDto {
  @ApiProperty({
    description: 'Nombre del fármaco. Obligatorio.',
    example: 'Enalapril',
    maxLength: 150,
  })
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'drug_name is required for every medication.' })
  @MaxLength(150)
  drug_name: string;

  @ApiPropertyOptional({
    description: 'Presentación o concentración.',
    example: '10 mg',
    maxLength: 100,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  presentation?: string;

  @ApiPropertyOptional({
    description: 'Dosis por toma.',
    example: '1 tableta',
    maxLength: 100,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  dose?: string;

  @ApiPropertyOptional({
    description: 'Frecuencia de administración.',
    example: 'Cada 12 horas',
    maxLength: 100,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Duración del tratamiento.',
    example: '7 días',
    maxLength: 100,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  duration?: string;
}
