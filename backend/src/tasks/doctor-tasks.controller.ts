import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { task_priority_enum, task_status_enum } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@Controller('api/v1/doctors/:doctorId/tasks')
export class DoctorTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  @ApiOperation({ summary: 'Create a new task for a doctor' })
  @ApiParam({ name: 'doctorId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', example: 'Revisar resultados de laboratorio' },
        description: { type: 'string', nullable: true },
        priority: { type: 'string', enum: Object.values(task_priority_enum) },
        due_date: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  create(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() payload: CreateTaskDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tasksService.create(doctorId, payload, user);
  }

  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({ summary: 'Get tasks for a doctor (filterable, paginated)' })
  @ApiParam({ name: 'doctorId', type: Number, example: 1 })
  @ApiQuery({ name: 'status', enum: task_status_enum, required: false })
  @ApiQuery({
    name: 'sortBy',
    enum: ['due_date', 'priority'],
    required: false,
  })
  @ApiQuery({ name: 'order', enum: ['asc', 'desc'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  findAll(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query() query: QueryTasksDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tasksService.findAllForDoctor(doctorId, query, user);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get task summary for a doctor' })
  @ApiParam({ name: 'doctorId', type: Number, example: 1 })
  summary(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tasksService.getSummary(doctorId, user);
  }
}
