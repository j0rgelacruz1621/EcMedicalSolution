import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { CreateMedicalCenterDto } from './dto/create-medical-center.dto';
import { CreateOfficeDto } from './dto/create-office.dto';
import { MedicalCentersService } from './medical-centers.service';

@ApiTags('medical-centers')
@Controller('medical-centers')
export class MedicalCentersController {
  constructor(private readonly service: MedicalCentersService) {}

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a new medical center' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Hospital Central' },
        address: { type: 'string', nullable: true },
        phone: { type: 'string', nullable: true },
      },
    },
  })
  createMedicalCenter(@Body() payload: CreateMedicalCenterDto) {
    return this.service.createMedicalCenter(payload);
  }

  @Public()
  @Post('offices')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a new office for a medical center' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['medicalCenterId', 'officeNumber'],
      properties: {
        medicalCenterId: { type: 'number', example: 1 },
        officeNumber: { type: 'string', example: '201' },
        locationDetails: { type: 'string', nullable: true },
      },
    },
  })
  createOffice(@Body() payload: CreateOfficeDto) {
    return this.service.createOffice(payload);
  }
}
