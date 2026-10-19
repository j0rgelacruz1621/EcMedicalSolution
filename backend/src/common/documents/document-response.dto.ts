import { ApiProperty } from '@nestjs/swagger';

// Esquemas Swagger compartidos por los documentos clínicos imprimibles.

export class DocumentPatientSummaryDto {
  @ApiProperty({ description: 'id del paciente.', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Nombre y apellido del paciente.',
    example: 'Ricardo Mendoza',
  })
  full_name: string;

  @ApiProperty({
    description: 'Cédula / documento de identidad.',
    example: 'V-12345678',
  })
  national_id: string;

  @ApiProperty({
    description: 'Edad registrada del paciente.',
    type: Number,
    nullable: true,
    example: 54,
  })
  age: number | null;
}

export class DocumentDoctorSummaryDto {
  @ApiProperty({ description: 'id del médico emisor.', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Nombre y apellido del médico emisor.',
    example: 'Ana Pérez',
  })
  full_name: string;

  @ApiProperty({
    description: 'Especialidad del médico.',
    type: String,
    nullable: true,
    example: 'Cardiología',
  })
  specialty: string | null;
}

export class DocumentHeaderDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Imagen del membrete: la guardada en el documento, si no la del médico, si no la del centro médico. Si es null, el cliente muestra nombre y especialidad.',
    example: 'https://storage.provider.com/headers/doctor_123_header.png',
  })
  image_url: string | null;

  @ApiProperty({
    description:
      'Nombre del médico, para el membrete de texto cuando no hay imagen.',
    example: 'Ana Pérez',
  })
  doctor_name: string;

  @ApiProperty({
    description: 'Especialidad del médico, para el membrete de texto.',
    type: String,
    nullable: true,
    example: 'Cardiología',
  })
  specialty: string | null;

  @ApiProperty({
    description:
      'Nombre del centro médico, si el documento tiene uno asociado.',
    type: String,
    nullable: true,
    example: 'Centro Médico Caracas',
  })
  medical_center_name: string | null;
}

export class DocumentFooterDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Consultorio y dirección del centro médico.',
    example: 'Consultorio 12, Piso 2 · Av. Principal de Las Mercedes',
  })
  address: string | null;

  @ApiProperty({
    type: [String],
    description: 'Teléfono del médico y del centro médico (los que existan).',
    example: ['0412-0000000', '0212-0000000'],
  })
  phones: string[];

  @ApiProperty({
    description: 'Correo de contacto del médico.',
    example: 'dra.perez@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Número de registro médico.',
    example: 'MPPS-12345',
  })
  license_number: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Número de colegiatura (C.M.).',
    example: 'CM-6789',
  })
  cm_number: string | null;
}
