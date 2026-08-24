import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { report_status_enum } from '@prisma/client';
import { Public } from '../auth/public.decorator';
import { AttachReportFileDto } from './dto/attach-report-file.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Post()
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  @ApiOperation({ summary: 'Create a new medical report' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['patient_id', 'doctor_id', 'title'],
      properties: {
        patient_id: { type: 'number', example: 1 },
        doctor_id: { type: 'number', example: 1 },
        appointment_id: { type: 'number', nullable: true },
        title: { type: 'string', example: 'Consulta general' },
        content: { type: 'string', nullable: true },
      },
    },
  })
  create(@Body() payload: CreateReportDto) {
    return this.reportsService.create(payload);
  }

  @Public()
  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({ summary: 'Get reports (filterable, paginated)' })
  @ApiQuery({ name: 'patient_id', type: Number, required: false })
  @ApiQuery({ name: 'doctor_id', type: Number, required: false })
  @ApiQuery({
    name: 'status',
    enum: report_status_enum,
    required: false,
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  findAll(@Query() query: QueryReportsDto) {
    return this.reportsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get one report by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Public()
  @Patch(':id/status')
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  @ApiOperation({ summary: 'Update a report status' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: Object.values(report_status_enum) },
      },
    },
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(id, payload);
  }

  @Public()
  @Post(':id/attachment')
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  @ApiOperation({ summary: 'Attach a file to a report' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file_url'],
      properties: {
        file_url: {
          type: 'string',
          example: 'https://storage.example.com/reports/1.pdf',
        },
      },
    },
  })
  attachFile(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: AttachReportFileDto,
  ) {
    return this.reportsService.attachFile(id, payload);
  }
}
