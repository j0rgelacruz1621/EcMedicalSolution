import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class CreateLaboratoryCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría. Único en el catálogo.',
    example: 'Hematología',
    maxLength: 100,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la categoría.',
    example: 'Estudios de las células sanguíneas y la coagulación.',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Si la categoría está disponible para nuevas órdenes.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
