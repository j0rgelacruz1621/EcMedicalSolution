import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginatedMedicalReportsResponseDto } from './dto/medical-report-response.dto';
import { QueryMedicalReportsDto } from './dto/query-medical-reports.dto';
import { MedicalReportsService } from './medical-reports.service';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('medical-reports')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Token ausente, inválido o expirado.',
})
@Controller('api/v1/patients/:patientId/medical-reports')
export class PatientMedicalReportsController {
  constructor(private readonly medicalReportsService: MedicalReportsService) {}

  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Informes y constancias de un paciente',
    description:
      'Lista paginada, del más reciente al más antiguo. Filtros opcionales por rango de fecha de emisión ' +
      '(startDate/endDate, inclusivos) y por tipo.',
  })
  @ApiParam({
    name: 'patientId',
    type: Number,
    example: 1,
    description: 'id del paciente',
  })
  @ApiOkResponse({
    description: 'Página de informes del paciente que cumplen los filtros.',
    type: PaginatedMedicalReportsResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'patientId inválido o filtros inválidos (formato de fecha, tipo, paginación, o startDate posterior a endDate).',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El paciente no existe.',
  })
  findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: QueryMedicalReportsDto,
  ) {
    return this.medicalReportsService.findByPatient(patientId, query);
  }
}
