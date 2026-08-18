import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DoctorReportsController } from './doctor-reports.controller';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController, DoctorReportsController],
  providers: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
