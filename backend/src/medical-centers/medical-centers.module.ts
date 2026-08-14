import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MedicalCentersController } from './medical-centers.controller';
import { MedicalCentersRepository } from './medical-centers.repository';
import { MedicalCentersService } from './medical-centers.service';

@Module({
  imports: [PrismaModule],
  controllers: [MedicalCentersController],
  providers: [MedicalCentersRepository, MedicalCentersService],
})
export class MedicalCentersModule {}
