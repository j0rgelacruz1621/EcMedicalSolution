import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';

export const MAX_ITEMS_PER_ORDER = 100;
export const MAX_ADDITIONAL_NOTES_LENGTH = 2000;

export class OrderCatalogTestDto {
  @ApiProperty({ description: 'Examen del catálogo.', example: 3 })
  @IsInt()
  @Min(1)
  test_id: number;

  @ApiProperty({
    description:
      'Categoría del examen. Debe ser la categoría a la que pertenece test_id; se usa para agrupar la orden por secciones.',
    example: 1,
  })
  @IsInt()
  @Min(1)
  category_id: number;
}

export class OrderCustomTestDto {
  @ApiPropertyOptional({
    description:
      'Sección donde se imprime. Si coincide con una categoría del catálogo se agrupa con ella; si se omite va en "Otros exámenes".',
    example: 'Inmunología',
    maxLength: 100,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  category_name?: string;

  @ApiProperty({
    description: 'Nombre del examen no catalogado.',
    example: 'Antígeno específico no catalogado',
    maxLength: 200,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  test_name: string;
}

// Campos clínicos de la orden, comunes a creación y modificación.
export class LaboratoryOrderContentDto {
  @ApiPropertyOptional({
    description: 'Diagnóstico o motivo de la solicitud.',
    example: 'Evaluación preventiva anual',
    maxLength: 500,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;

  @ApiPropertyOptional({
    description:
      'Instrucciones pre-analíticas / notas de preparación para el paciente.',
    example: 'Ayunar mínimo 8 a 12 horas.',
    maxLength: MAX_ADDITIONAL_NOTES_LENGTH,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(MAX_ADDITIONAL_NOTES_LENGTH)
  additional_notes?: string;

  @ApiPropertyOptional({
    description: 'Exámenes del catálogo, en el orden en que se imprimen.',
    type: [OrderCatalogTestDto],
    maxItems: MAX_ITEMS_PER_ORDER,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS_PER_ORDER)
  @ValidateNested({ each: true })
  @Type(() => OrderCatalogTestDto)
  tests?: OrderCatalogTestDto[];

  @ApiPropertyOptional({
    description: 'Exámenes personalizados que no están en el catálogo.',
    type: [OrderCustomTestDto],
    maxItems: MAX_ITEMS_PER_ORDER,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITEMS_PER_ORDER)
  @ValidateNested({ each: true })
  @Type(() => OrderCustomTestDto)
  custom_tests?: OrderCustomTestDto[];
}
