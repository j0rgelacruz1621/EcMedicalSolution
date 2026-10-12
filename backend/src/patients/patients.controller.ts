import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
  ApiUnauthorizedResponse,
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
    age: 34,
    origin: 'Mérida',
    address: 'Av. Principal, Edif. Los Jaros, Mérida',
    assignedDoctorId: 1,
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

const PATIENT_BODY_PROPERTIES = {
  nationalId: { type: 'string', example: '0102030405' },
  firstName: { type: 'string', example: 'Juan' },
  lastName: { type: 'string', example: 'Perez' },
  email: { type: 'string', example: 'juan@example.com' },
  phone: { type: 'string', example: '0999999999' },
  gender: { type: 'string', enum: Object.values(PatientGender) },
  isActive: { type: 'boolean' },
  age: { type: 'integer', nullable: true, minimum: 0, maximum: 120 },
  origin: { type: 'string', nullable: true },
  address: { type: 'string', nullable: true },
  assignedDoctorId: { type: 'integer', nullable: true, minimum: 1 },
  medicalHistoryNotes: { type: 'string', nullable: true },
  vitals: VITALS_SCHEMA,
};

const UPDATE_BAD_REQUEST_RESPONSE = {
  status: 400,
  description:
    'Algún dato tiene un formato inválido (email, age, gender, isActive, bloodPressure), el id no es numérico, ' +
    'o assignedDoctorId no corresponde a un médico existente.',
};

const UPDATE_NOT_FOUND_RESPONSE = {
  status: 404,
  description: 'No existe un paciente con el id indicado.',
};

const UPDATE_CONFLICT_RESPONSE = {
  status: 409,
  description: 'El national_id o el email enviados pertenecen a otro paciente.',
};

@ApiTags('patients')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'Falta el token Bearer, es inválido o ha expirado.',
})
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
    summary: 'Registrar un nuevo paciente',
    description:
      'Guarda la información demográfica y médica inicial del paciente en "patients" y le asigna un id único. ' +
      'Si se incluye "vitals", se registra además, en la misma transacción de PostgreSQL (BEGIN/COMMIT), su primer ' +
      'signo vital de triaje en "patient_vitals"; si falla cualquiera de las dos inserciones se ejecuta ROLLBACK. ' +
      'El campo "bloodPressure" (ej. "120/80") se desglosa en blood_pressure_systolic = 120 y blood_pressure_diastolic = 80. ' +
      'Se valida la unicidad de national_id y de email (sin distinguir mayúsculas) antes de intentar la inserción. age es opcional; si se envía debe ser un entero entre 0 y 120. ' +
      'is_active toma true por defecto y created_at/updated_at se asignan automáticamente.',
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
        'gender',
      ],
      properties: {
        nationalId: { type: 'string', example: '0102030405' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Perez' },
        email: { type: 'string', example: 'juan@example.com' },
        phone: { type: 'string', example: '0999999999' },
        age: {
          type: 'integer',
          nullable: true,
          minimum: 0,
          maximum: 120,
          example: 34,
        },
        origin: { type: 'string', nullable: true, example: 'Mérida' },
        address: {
          type: 'string',
          nullable: true,
          example: 'Av. Principal, Edif. Los Jaros, Mérida',
        },
        assignedDoctorId: {
          type: 'integer',
          nullable: true,
          minimum: 1,
          example: 1,
          description:
            'Id del médico al que se asigna el paciente (opcional). Debe existir en "doctors". Permite verlo sin necesidad de una cita.',
        },
        isActive: {
          type: 'boolean',
          nullable: true,
          default: true,
          description: 'Si se omite, el paciente se registra como activo.',
        },
        gender: { type: 'string', enum: Object.values(PatientGender) },
        medicalHistoryNotes: { type: 'string', nullable: true },
        vitals: { ...VITALS_SCHEMA, nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Paciente creado. Si se envió "vitals", incluye también el registro inicial de signos vitales.',
    schema: { example: PATIENT_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description:
      'Faltan campos obligatorios o algún formato es inválido: email, age (entero entre 0 y 120), gender, isActive, ' +
      'bloodPressure con un formato distinto de "sistólica/diastólica", o assignedDoctorId no corresponde a un médico existente.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Ya existe un paciente registrado con el national_id o el email enviados.',
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
      'Permite filtrar por nationalId (coincidencia parcial), por "search" (cada palabra debe coincidir parcialmente con ' +
      'first_name o last_name, sin distinguir mayúsculas/minúsculas) y por isActive. Los filtros se combinan con AND. ' +
      'Los resultados se ordenan por created_at DESC. ' +
      'Cada paciente incluido en la respuesta trae su último registro de signos vitales capturado en el campo "latestVitals".',
  })
  @ApiQuery({
    name: 'nationalId',
    type: String,
    required: false,
    example: '0102030405',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    example: 'juan perez',
    description: 'Término buscado en first_name o last_name.',
  })
  @ApiQuery({
    name: 'isActive',
    type: Boolean,
    required: false,
    description: 'Filtra por pacientes activos (true) o inactivos (false).',
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
  @ApiQuery({ name: 'doctorId', type: Number, required: false, example: 1 })
  @ApiResponse({
    status: 200,
    description:
      'Lista paginada de pacientes con su último registro de signos vitales.',
    schema: {
      example: {
        data: [
          {
            ...PATIENT_RESPONSE_EXAMPLE.patient,
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
  @ApiResponse({
    status: 400,
    description:
      'Algún parámetro es inválido: isActive distinto de true/false, page, limit o doctorId que no son enteros ≥ 1, o un parámetro desconocido.',
  })
  findAll(@Query() query: QueryPatientsDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener el detalle de un paciente',
    description:
      'Retorna la entidad completa del paciente junto con su último registro de signos vitales en "latestVitals".',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paciente encontrado con su último registro de signos vitales.',
    schema: {
      example: {
        ...PATIENT_RESPONSE_EXAMPLE.patient,
        latestVitals: PATIENT_RESPONSE_EXAMPLE.vitals,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un paciente con el id indicado.',
  })
  @ApiResponse({ status: 400, description: 'El id no es numérico.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.findOne(id);
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
  @ApiResponse({
    status: 400,
    description: 'El id no es numérico, o page/limit no son enteros ≥ 1.',
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
    summary: 'Actualizar parcialmente los datos de un paciente',
    description:
      'Modifica solo los campos enviados; el resto conserva su valor. Aplica las mismas validaciones de formato que el registro. ' +
      'Los campos opcionales (age, origin, address, assignedDoctorId, medicalHistoryNotes) aceptan null para borrar su valor. ' +
      'Si cambia nationalId o email, se valida que no pertenezcan a otro paciente. updated_at se actualiza automáticamente. ' +
      'Si se incluye "vitals", se registra una nueva medición de signos vitales junto con la actualización, en una única transacción.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ schema: { type: 'object', properties: PATIENT_BODY_PROPERTIES } })
  @ApiResponse({
    status: 200,
    description:
      'Paciente actualizado, con su último registro de signos vitales.',
    schema: { example: PATIENT_RESPONSE_EXAMPLE },
  })
  @ApiResponse(UPDATE_BAD_REQUEST_RESPONSE)
  @ApiResponse(UPDATE_NOT_FOUND_RESPONSE)
  @ApiResponse(UPDATE_CONFLICT_RESPONSE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, payload);
  }

  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Reemplazar todos los datos de un paciente',
    description:
      'Actualización completa: exige los mismos campos obligatorios que el registro. Los campos opcionales que no se envíen ' +
      'vuelven a su valor inicial (null, o true para isActive). Si cambia nationalId o email, se valida que no pertenezcan ' +
      'a otro paciente. updated_at se actualiza automáticamente. Si se incluye "vitals", se registra una nueva medición.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'nationalId',
        'firstName',
        'lastName',
        'email',
        'phone',
        'gender',
      ],
      properties: PATIENT_BODY_PROPERTIES,
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Paciente actualizado, con su último registro de signos vitales.',
    schema: { example: PATIENT_RESPONSE_EXAMPLE },
  })
  @ApiResponse(UPDATE_BAD_REQUEST_RESPONSE)
  @ApiResponse(UPDATE_NOT_FOUND_RESPONSE)
  @ApiResponse(UPDATE_CONFLICT_RESPONSE)
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreatePatientDto,
  ) {
    return this.patientsService.replace(id, payload);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un paciente (borrado lógico)',
    description:
      'Marca al paciente como inactivo (is_active = false) y actualiza updated_at. No elimina la fila, por lo que sus ' +
      'citas, signos vitales y reportes se conservan intactos. Es idempotente: desactivar un paciente ya inactivo ' +
      'responde 200 sin modificarlo. Para reactivarlo, enviar isActive = true con PATCH.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paciente desactivado.',
    schema: {
      example: { ...PATIENT_RESPONSE_EXAMPLE.patient, isActive: false },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es numérico.' })
  @ApiResponse({
    status: 404,
    description: 'No existe un paciente con el id indicado.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.remove(id);
  }
}
