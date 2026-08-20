import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePatientDto, PatientGender } from './dto/create-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { QueryVitalsDto } from './dto/query-vitals.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

const VITALS_SCHEMA = {
  type: 'object',
  properties: {
    bloodPressure: {
      type: 'string',
      example: '120/80',
      description:
        'Presión arterial en formato "sistólica/diastólica". Se desglosa automáticamente en blood_pressure_systolic y blood_pressure_diastolic.',
    },
    heartRateBpm: { type: 'number', example: 78, nullable: true },
    weightKg: { type: 'number', example: 70.5, nullable: true },
    measuredAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description:
        'Fecha/hora de la medición. Si se omite, se usa el momento del registro.',
    },
  },
} as const;

const PATIENT_RESPONSE_EXAMPLE = {
  patient: {
    id: 1,
    nationalId: '0102030405',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@example.com',
    phone: '0999999999',
    dateOfBirth: '1990-05-12T00:00:00.000Z',
    gender: 'Male',
    medicalHistoryNotes: null,
    isActive: true,
    createdAt: '2026-08-20T15:00:00.000Z',
    updatedAt: '2026-08-20T15:00:00.000Z',
  },
  vitals: {
    id: 1,
    patient_id: 1,
    appointment_id: null,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    heart_rate_bpm: 78,
    weight_kg: 70.5,
    measured_at: '2026-08-20T15:00:00.000Z',
    created_at: '2026-08-20T15:00:00.000Z',
  },
};

@ApiTags('patients')
@ApiBearerAuth('access-token')
@Controller('api/v1/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Registrar un nuevo paciente con sus signos vitales de triaje',
    description:
      'Procesa el formulario "Agregar Paciente": guarda en una única transacción de PostgreSQL (BEGIN/COMMIT) la ' +
      'información del paciente en "patients" y su primer registro de signos vitales en "patient_vitals". Si falla ' +
      'la inserción de cualquiera de las dos tablas, se ejecuta ROLLBACK y no queda ningún registro parcial. ' +
      'El campo "bloodPressure" (ej. "120/80") se desglosa en blood_pressure_systolic = 120 y blood_pressure_diastolic = 80. ' +
      'Se valida la unicidad de national_id antes de intentar la inserción.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'nationalId',
        'firstName',
        'lastName',
        'email',
        'phone',
        'dateOfBirth',
        'gender',
        'vitals',
      ],
      properties: {
        nationalId: { type: 'string', example: '0102030405' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Perez' },
        email: { type: 'string', example: 'juan@example.com' },
        phone: { type: 'string', example: '0999999999' },
        dateOfBirth: { type: 'string', format: 'date', example: '1990-05-12' },
        gender: { type: 'string', enum: Object.values(PatientGender) },
        medicalHistoryNotes: { type: 'string', nullable: true },
        vitals: VITALS_SCHEMA,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Paciente creado junto con el registro inicial de sus signos vitales.',
    schema: { example: PATIENT_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, por ejemplo bloodPressure con un formato distinto de "sistólica/diastólica".',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un paciente registrado con el national_id enviado.',
  })
  create(@Body() payload: CreatePatientDto) {
    return this.patientsService.create(payload);
  }

  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Buscar y listar pacientes (paginado)',
    description:
      'Permite filtrar por national_id, first_name y/o last_name (coincidencia parcial, insensible a mayúsculas/minúsculas). ' +
      'Cada paciente incluido en la respuesta trae su último registro de signos vitales capturado en el campo "latestVitals".',
  })
  @ApiQuery({
    name: 'nationalId',
    type: String,
    required: false,
    example: '0102030405',
  })
  @ApiQuery({
    name: 'firstName',
    type: String,
    required: false,
    example: 'Juan',
  })
  @ApiQuery({
    name: 'lastName',
    type: String,
    required: false,
    example: 'Perez',
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description:
      'Lista paginada de pacientes con su último registro de signos vitales.',
    schema: {
      example: {
        data: [
          {
            id: 1,
            nationalId: '0102030405',
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'juan@example.com',
            phone: '0999999999',
            dateOfBirth: '1990-05-12T00:00:00.000Z',
            gender: 'Male',
            medicalHistoryNotes: null,
            isActive: true,
            createdAt: '2026-08-20T15:00:00.000Z',
            updatedAt: '2026-08-20T15:00:00.000Z',
            latestVitals: PATIENT_RESPONSE_EXAMPLE.vitals,
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    },
  })
  findAll(@Query() query: QueryPatientsDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id/vitals')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Consultar el historial de signos vitales de un paciente',
    description:
      'Retorna las constantes vitales registradas para el paciente indicado, ordenadas por measured_at DESC (paginado).',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description:
      'Historial de signos vitales del paciente, del más reciente al más antiguo.',
    schema: {
      example: {
        data: [PATIENT_RESPONSE_EXAMPLE.vitals],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un paciente con el id indicado.',
  })
  findVitalsHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryVitalsDto,
  ) {
    return this.patientsService.findVitalsHistory(id, query);
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Actualizar los datos de un paciente',
    description:
      'Actualiza los datos demográficos del paciente. Si se incluye "vitals", se registra una nueva medición de ' +
      'signos vitales junto con la actualización del paciente, en una única transacción.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', nullable: true },
        lastName: { type: 'string', nullable: true },
        email: { type: 'string', nullable: true },
        phone: { type: 'string', nullable: true },
        dateOfBirth: { type: 'string', format: 'date', nullable: true },
        gender: {
          type: 'string',
          enum: Object.values(PatientGender),
          nullable: true,
        },
        medicalHistoryNotes: { type: 'string', nullable: true },
        vitals: VITALS_SCHEMA,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Paciente actualizado, con su último registro de signos vitales.',
    schema: { example: PATIENT_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un paciente con el id indicado.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, payload);
  }
}
