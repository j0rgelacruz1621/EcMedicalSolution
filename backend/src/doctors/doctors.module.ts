import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DoctorsController } from './doctors.controller.js';
import { DoctorsService } from './doctors.service.js';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, PrismaService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
