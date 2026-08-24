import { task_priority_enum } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(task_priority_enum, {
    message: `priority must be one of: ${Object.values(task_priority_enum).join(', ')}`,
  })
  priority?: task_priority_enum;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}
