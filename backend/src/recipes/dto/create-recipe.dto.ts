import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { UpdateRecipeDto } from './update-recipe.dto';

export class CreateRecipeDto extends UpdateRecipeDto {
  @ApiProperty({
    description: 'Paciente al que se emite el récipe.',
    example: 1,
  })
  @IsInt()
  @Min(1)
  patient_id: number;

  @ApiPropertyOptional({
    description:
      'Médico firmante. Obligatorio solo para cuentas SA; un médico (rol DOCTOR) firma siempre con el doctorId de su token y no puede enviar otro.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  doctor_id?: number;

  @ApiPropertyOptional({
    description:
      'Centro médico. Si se omite, se toma del consultorio asignado al médico.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  medical_center_id?: number;

  @ApiPropertyOptional({
    description: 'Cita asociada. Debe pertenecer al mismo paciente.',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  appointment_id?: number;

  @ApiPropertyOptional({
    description:
      'Fecha de emisión en la zona horaria del consultorio (YYYY-MM-DD). Si se omite, se usa la fecha actual del servidor.',
    example: '2026-07-13',
    format: 'date',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'issue_date must be YYYY-MM-DD.' })
  issue_date?: string;
}
