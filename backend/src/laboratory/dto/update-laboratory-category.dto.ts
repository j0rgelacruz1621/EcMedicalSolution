import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export class UpdateLaboratoryCategoryDto {
  @ApiPropertyOptional({
    description: 'Nombre de la categoría. Único en el catálogo.',
    example: 'Hematología',
    maxLength: 100,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la categoría. Enviar "" para borrarla.',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description:
      'false oculta la categoría (y sus exámenes) del catálogo para nuevas órdenes. Las órdenes existentes no cambian.',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
