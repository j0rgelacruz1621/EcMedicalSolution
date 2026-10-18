import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/current-user.decorator';
import { CreateMedicalReportDto } from './dto/create-medical-report.dto';
import {
  MedicalReportDocumentResponseDto,
  MedicalReportResponseDto,
} from './dto/medical-report-response.dto';
import { UpdateMedicalReportDto } from './dto/update-medical-report.dto';
import { MedicalReportsService } from './medical-reports.service';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

const idParam = {
  name: 'id',
  type: Number,
  example: 1,
  description: 'id del informe médico',
};

@ApiTags('medical-reports')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Token ausente, inválido o expirado.',
})
@Controller('api/v1/medical-reports')
export class MedicalReportsController {
  constructor(private readonly medicalReportsService: MedicalReportsService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Emitir un informe de reposo o constancia médica',
    description:
      'Valida los campos obligatorios (patient_id, doctor_id, title, content, issue_date). Para REPOSO_MEDICO exige ' +
      'rest_start_date y rest_end_date o rest_days; si se envían ambos deben coincidir (los días cuentan inicio y fin) ' +
      'y el que falte se calcula. Los tipos CONSTANCIA_ASISTENCIA e INFORME_MEDICO no admiten campos de reposo. ' +
      'El membrete vigente (del médico o, si no tiene, del centro médico) se copia en el informe.',
  })
  @ApiCreatedResponse({
    description: 'Informe creado.',
    type: MedicalReportResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Campos obligatorios ausentes o con formato inválido, período de reposo incoherente, CIE-10 inválido, ' +
      'o paciente/médico/centro/cita inexistente o cita de otro paciente.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Un médico intenta emitir a nombre de otro médico.',
  })
  create(
    @Body() payload: CreateMedicalReportDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.medicalReportsService.create(payload, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de un informe médico',
    description:
      'Devuelve el informe completo (incluye contenido, período de reposo, diagnóstico, estado y resumen de ' +
      'paciente y médico) en cualquier estado, también si está firmado o anulado.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Detalle del informe.',
    type: MedicalReportResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'El id no es un número entero válido.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El informe no existe.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicalReportsService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Modificar un informe médico',
    description:
      'Actualización parcial de título, descripción, contenido, diagnóstico y período de reposo. El estado pasa a ' +
      'EDITED. No se puede modificar un informe SIGNED o CANCELLED. Si se cambia rest_days sin rest_end_date (o al ' +
      'revés), el otro valor se recalcula; si solo cambia rest_start_date, el período se desplaza conservando los días. ' +
      'Solo el médico emisor o una cuenta SA.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Informe actualizado.',
    type: MedicalReportResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'id inválido, cuerpo vacío, formato inválido, período de reposo incoherente o campos de reposo en un tipo que no los admite.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El informe pertenece a otro médico.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El informe no existe.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'El informe está firmado o anulado (o cambió de estado en paralelo).',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateMedicalReportDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.medicalReportsService.update(id, payload, user);
  }

  @Patch(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Firmar un informe médico',
    description:
      'Pasa el informe de ACTIVE/EDITED a SIGNED. Un informe firmado ya no se puede modificar, solo anular. ' +
      'Solo el médico emisor o una cuenta SA.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Informe firmado (status SIGNED).',
    type: MedicalReportResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'El id no es un número entero válido.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El informe pertenece a otro médico.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El informe no existe.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'El informe ya está firmado o anulado.',
  })
  sign(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.medicalReportsService.sign(id, user);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Anular un informe médico',
    description:
      'Pasa el informe a CANCELLED (también si estaba firmado). El registro se conserva. ' +
      'Solo el médico emisor o una cuenta SA.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Informe anulado (status CANCELLED).',
    type: MedicalReportResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'El id no es un número entero válido.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El informe pertenece a otro médico.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El informe no existe.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'El informe ya está anulado.',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.medicalReportsService.cancel(id, user);
  }

  @Get(':id/document')
  @ApiOperation({
    summary: 'Documento imprimible del informe',
    description:
      'Estructura lista para la vista de impresión / exportación a PDF: header (imagen de membrete desde BD), ' +
      'cuerpo (título, paciente, fecha de emisión, reposo, diagnóstico, descripción y contenido) y footer ' +
      '(dirección, teléfonos, correo, registro médico y C.M. para el bloque de firma y sello).',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description:
      'Datos del documento: header (membrete), medical_report (cuerpo) y footer (contacto, registro y firma).',
    type: MedicalReportDocumentResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'El id no es un número entero válido.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El informe no existe.',
  })
  getDocument(@Param('id', ParseIntPipe) id: number) {
    return this.medicalReportsService.getPrintableDocument(id);
  }
}
