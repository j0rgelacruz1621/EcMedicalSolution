import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
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
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedules.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { DoctorsService } from './doctors.service.js';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a new doctor' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['licenseNumber', 'nationalId', 'firstName', 'lastName', 'email'],
      properties: {
        licenseNumber: { type: 'string', example: 'LIC-001' },
        nationalId: { type: 'string', example: '0102030405' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Perez' },
        email: { type: 'string', example: 'juan@example.com' },
        phone: { type: 'string', nullable: true },
        specialty: { type: 'string', nullable: true },
        officeId: { type: 'number', nullable: true },
      },
    },
  })
  create(@Body() payload: CreateDoctorDto) {
    return this.doctorsService.create(payload);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all doctors (paginated)' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  findAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.doctorsService.findAll(page, limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get one doctor by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SA')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Update a doctor' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateDoctorDto) {
    return this.doctorsService.update(id, payload);
  }

  @Public()
  @Post(':id/schedules')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create schedules for a doctor' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['schedules'],
      properties: {
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            required: ['dayOfWeek', 'startTime', 'endTime'],
            properties: {
              dayOfWeek: {
                type: 'string',
                enum: [
                  'MONDAY',
                  'TUESDAY',
                  'WEDNESDAY',
                  'THURSDAY',
                  'FRIDAY',
                  'SATURDAY',
                  'SUNDAY',
                ],
              },
              startTime: { type: 'string', example: '08:00' },
              endTime: { type: 'string', example: '17:00' },
            },
          },
        },
      },
    },
  })
  createSchedules(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateDoctorSchedulesDto,
  ) {
    return this.doctorsService.createSchedules(id, payload);
  }
}
