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
import { Public } from '../auth/public.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentScheduleDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Get('patient/:nationalId')
  findByPatientNationalId(@Param('nationalId') nationalId: string) {
    return this.appointmentsService.findByPatientNationalId(nationalId);
  }

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() payload: CreateAppointmentDto) {
    return this.appointmentsService.create(payload);
  }

  @Public()
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateAppointmentScheduleDto,
  ) {
    return this.appointmentsService.updateSchedule(id, payload);
  }
}
