import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/transformers/trim.transformer';
import { RecipeMedicationDto } from './recipe-medication.dto';

export const MAX_ADDITIONAL_INSTRUCTIONS = 500;
export const MAX_MEDICATIONS_PER_RECIPE = 30;

// Editar un récipe reemplaza su contenido clínico completo (nueva versión).
// Paciente, médico y fecha de emisión no cambian al editar.
export class UpdateRecipeDto {
  @ApiProperty({
    description: `Medicamentos prescritos, en el orden en que se imprimen. Mínimo 1, máximo ${MAX_MEDICATIONS_PER_RECIPE}.`,
    type: [RecipeMedicationDto],
    minItems: 1,
    maxItems: MAX_MEDICATIONS_PER_RECIPE,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one medication is required.' })
  @ArrayMaxSize(MAX_MEDICATIONS_PER_RECIPE)
  @ValidateNested({ each: true })
  @Type(() => RecipeMedicationDto)
  medications: RecipeMedicationDto[];

  @ApiPropertyOptional({
    description:
      'Indicaciones adicionales: dieta, reposo u observaciones clínicas.',
    example: 'Tomar abundante agua y mantener reposo relativo.',
    maxLength: MAX_ADDITIONAL_INSTRUCTIONS,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(MAX_ADDITIONAL_INSTRUCTIONS)
  additional_instructions?: string;
}
