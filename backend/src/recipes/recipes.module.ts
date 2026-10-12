import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientRecipesController } from './patient-recipes.controller';
import { RecipesController } from './recipes.controller';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecipesController, PatientRecipesController],
  providers: [RecipesRepository, RecipesService],
})
export class RecipesModule {}
