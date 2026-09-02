import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { appointment_status_enum } from '@prisma/client';
import { Public } from '../auth/public.decorator';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'List and filter appointments (paginated)',
    description:
      'Returns appointments filtered by doctor_id, medical_center_id, patient_id, status and a date range (start_date/end_date) or an exact appointment_date. ' +
      'Results are ordered by appointment_date DESC, start_time DESC by default. ' +
      'Response follows this API\'s standard paginated shape, PaginatedResponseDto: { data, page, limit, total, totalPages }.',
  })
  @ApiOkResponse({ type: PaginatedResponseDto })
  @ApiQuery({ name: 'doctor_id', type: Number, required: false })
  @ApiQuery({ name: 'medical_center_id', type: Number, required: false })
  @ApiQuery({ name: 'patient_id', type: Number, required: false })
  @ApiQuery({
    name: 'status',
    enum: appointment_status_enum,
    required: false,
  })
  @ApiQuery({
    name: 'appointment_date',
    type: String,
    required: false,
    description: 'Exact date (YYYY-MM-DD). Takes precedence over start_date/end_date.',
  })
  @ApiQuery({ name: 'start_date', type: String, required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'end_date', type: String, required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  findAll(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Public()
  @Get('patient/:nationalId')
  @ApiOperation({ summary: 'Get appointments by patient national id' })
  @ApiParam({ name: 'nationalId', type: String, example: '0102030405' })
  findByPatientNationalId(@Param('nationalId') nationalId: string) {
    return this.appointmentsService.findByPatientNationalId(nationalId);
  }

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'doctorId',
        'startAt',
        'endAt',
        'medicalCenterId',
        'officeId',
        'patient',
      ],
      properties: {
        doctorId: { type: 'number', example: 1 },
        startAt: { type: 'string', format: 'date-time' },
        endAt: { type: 'string', format: 'date-time' },
        medicalCenterId: { type: 'number', example: 1 },
        officeId: { type: 'number', example: 1 },
        reasonForVisit: { type: 'string', nullable: true },
        patient: {
          type: 'object',
          required: [
            'nationalId',
            'firstName',
            'lastName',
            'email',
            'phone',
            'dateOfBirth',
            'gender',
          ],
          properties: {
            nationalId: { type: 'string', example: '0102030405' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Perez' },
            email: { type: 'string', example: 'juan@example.com' },
            phone: { type: 'string', example: '0999999999' },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: {
              type: 'string',
              enum: ['MASCULINO', 'FEMENINO', 'OTRO'],
            },
            medicalHistoryNotes: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  create(@Body() payload: CreateAppointmentDto) {
    return this.appointmentsService.create(payload);
  }

  @Public()
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Update an appointment (partial or total)',
    description:
      'Updates any combination of status, appointment_date, start_time, end_time and office_id on an existing appointment. ' +
      'Fields left out of the payload keep their current value. Validates end_time > start_time, and rejects the update ' +
      'with 409 Conflict if the resulting schedule overlaps another SCHEDULED/CONFIRMED appointment for the same doctor or office.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'The updated appointment.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        appointment_date: {
          type: 'string',
          example: '2026-08-20',
          description: 'YYYY-MM-DD',
        },
        start_time: {
          type: 'string',
          example: '10:00:00',
          description: 'HH:mm:ss',
        },
        end_time: {
          type: 'string',
          example: '10:30:00',
          description: 'HH:mm:ss',
        },
        status: {
          type: 'string',
          enum: Object.values(appointment_status_enum),
        },
        office_id: { type: 'number', example: 1 },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, payload);
  }
}
