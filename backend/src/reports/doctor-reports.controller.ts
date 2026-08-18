import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('api/v1/doctors/:doctorId/reports')
export class DoctorReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Get('pending-count')
  @ApiOperation({ summary: 'Get pending report count for a doctor' })
  @ApiParam({ name: 'doctorId', type: Number, example: 1 })
  pendingCount(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.reportsService.pendingCountForDoctor(doctorId);
  }
}
