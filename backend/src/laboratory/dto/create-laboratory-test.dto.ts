import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateLaboratoryTestDto {
  @ApiProperty({ description: 'Categoría a la que pertenece.', example: 1 })
  @IsInt()
  @Min(1)
  category_id: number;

  @ApiPropertyOptional({
    description:
      'Código interno. Único en el catálogo; se normaliza a mayúsculas.',
    example: 'HEM-01',
    maxLength: 50,
  })
  @IsOptional()
  @Transform(toUpperTrimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  internal_code?: string;

  @ApiProperty({
    description: 'Nombre del examen. Único dentro de su categoría.',
    example: 'Hematología Completa',
    maxLength: 150,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Código LOINC del examen.',
    example: '58410-2',
    maxLength: 20,
  })
  @IsOptional()
  @Transform(toUpperTrimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  loinc_code?: string;

  @ApiPropertyOptional({
    description: 'Si el examen está disponible para nuevas órdenes.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
