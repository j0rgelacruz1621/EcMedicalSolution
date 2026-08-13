import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedules.dto.js';
import { DoctorsService } from './doctors.service.js';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() payload: CreateDoctorDto) {
    return this.doctorsService.create(payload);
  }

  @Public()
  @Get()
  findAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.doctorsService.findAll(page, limit);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Public()
  @Post(':id/schedules')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createSchedules(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateDoctorSchedulesDto,
  ) {
    return this.doctorsService.createSchedules(id, payload);
  }
}
