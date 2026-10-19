import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

const toUpperTrimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateLaboratoryTestDto {
  @ApiPropertyOptional({
    description: 'Mover el examen a otra categoría.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  category_id?: number;

  @ApiPropertyOptional({
    description: 'Código interno. Enviar "" para borrarlo.',
    example: 'HEM-01',
    maxLength: 50,
  })
  @IsOptional()
  @Transform(toUpperTrimmed)
  @IsString()
  @MaxLength(50)
  internal_code?: string;

  @ApiPropertyOptional({
    description: 'Nombre del examen.',
    example: 'Hematología Completa',
    maxLength: 150,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código LOINC. Enviar "" para borrarlo.',
    example: '58410-2',
    maxLength: 20,
  })
  @IsOptional()
  @Transform(toUpperTrimmed)
  @IsString()
  @MaxLength(20)
  loinc_code?: string;

  @ApiPropertyOptional({
    description:
      'false retira el examen del catálogo para nuevas órdenes. Las órdenes existentes no cambian.',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
