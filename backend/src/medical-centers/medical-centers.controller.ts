import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CreateMedicalCenterDto } from './dto/create-medical-center.dto';
import { CreateOfficeDto } from './dto/create-office.dto';
import { MedicalCentersService } from './medical-centers.service';

@Controller('medical-centers')
export class MedicalCentersController {
  constructor(private readonly service: MedicalCentersService) {}

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createMedicalCenter(@Body() payload: CreateMedicalCenterDto) {
    return this.service.createMedicalCenter(payload);
  }

  @Public()
  @Post('offices')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createOffice(@Body() payload: CreateOfficeDto) {
    return this.service.createOffice(payload);
  }
}
