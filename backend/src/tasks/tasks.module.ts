import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DoctorTasksController } from './doctor-tasks.controller';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule],
  controllers: [DoctorTasksController, TasksController],
  providers: [TasksRepository, TasksService],
})
export class TasksModule {}
