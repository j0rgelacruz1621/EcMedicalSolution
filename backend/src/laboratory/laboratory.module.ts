import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  LaboratoryCategoriesController,
  LaboratoryTestsController,
} from './laboratory-catalog.controller';
import { LaboratoryCatalogRepository } from './laboratory-catalog.repository';
import { LaboratoryCatalogService } from './laboratory-catalog.service';
import { LaboratoryOrderPdfService } from './laboratory-order-pdf.service';
import {
  LaboratoryOrdersController,
  PatientLaboratoryOrdersController,
} from './laboratory-orders.controller';
import { LaboratoryOrdersRepository } from './laboratory-orders.repository';
import { LaboratoryOrdersService } from './laboratory-orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    LaboratoryCategoriesController,
    LaboratoryTestsController,
    LaboratoryOrdersController,
    PatientLaboratoryOrdersController,
  ],
  providers: [
    LaboratoryCatalogRepository,
    LaboratoryCatalogService,
    LaboratoryOrdersRepository,
    LaboratoryOrdersService,
    LaboratoryOrderPdfService,
  ],
})
export class LaboratoryModule {}
