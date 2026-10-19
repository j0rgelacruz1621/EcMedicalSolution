import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MedicalReportsController } from './medical-reports.controller';
import { MedicalReportsRepository } from './medical-reports.repository';
import { MedicalReportsService } from './medical-reports.service';
import { PatientMedicalReportsController } from './patient-medical-reports.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MedicalReportsController, PatientMedicalReportsController],
  providers: [MedicalReportsRepository, MedicalReportsService],
})
export class MedicalReportsModule {}
