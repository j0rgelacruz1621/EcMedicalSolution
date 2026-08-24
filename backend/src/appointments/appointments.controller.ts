import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentScheduleDto } from './dto/create-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

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
  @ApiOperation({ summary: 'Reschedule an appointment' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['startAt', 'endAt'],
      properties: {
        startAt: { type: 'string', format: 'date-time' },
        endAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateAppointmentScheduleDto,
  ) {
    return this.appointmentsService.updateSchedule(id, payload);
  }
}
