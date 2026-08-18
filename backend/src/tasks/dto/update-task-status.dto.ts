import { task_status_enum } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsEnum(task_status_enum, {
    message: `status must be one of: ${Object.values(task_status_enum).join(', ')}`,
  })
  status: task_status_enum;
}
