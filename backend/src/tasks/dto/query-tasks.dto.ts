import { task_status_enum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryTasksDto {
  @IsOptional()
  @IsEnum(task_status_enum, {
    message: `status must be one of: ${Object.values(task_status_enum).join(', ')}`,
  })
  status?: task_status_enum;

  @IsOptional()
  @IsIn(['due_date', 'priority'])
  sortBy?: 'due_date' | 'priority';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
