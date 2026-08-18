import { report_status_enum } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateReportStatusDto {
  @IsEnum(report_status_enum, {
    message: `status must be one of: ${Object.values(report_status_enum).join(', ')}`,
  })
  status: report_status_enum;
}
