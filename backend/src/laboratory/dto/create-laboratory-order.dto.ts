import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';
import { LaboratoryOrderContentDto } from './laboratory-order-items.dto';

export class CreateLaboratoryOrderDto extends LaboratoryOrderContentDto {
  @ApiProperty({ description: 'Paciente.', example: 1 })
  @IsInt()
  @Min(1)
  patient_id: number;

  @ApiProperty({
    description:
      'Médico emisor. Un médico (rol DOCTOR) solo puede enviar su propio id; una cuenta SA puede emitir por cualquier médico.',
    example: 1,
  })
  @IsInt()
  @Min(1)
  doctor_id: number;

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

  @ApiProperty({
    description: 'Fecha de emisión (YYYY-MM-DD).',
    example: '2026-10-08',
    format: 'date',
  })
  @IsDateOnly()
  issue_date: string;
}
