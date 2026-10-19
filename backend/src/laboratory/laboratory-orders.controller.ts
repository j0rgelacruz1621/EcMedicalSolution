import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
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
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateLaboratoryOrderDto } from './dto/create-laboratory-order.dto';
import {
  LaboratoryOrderResponseDto,
  PaginatedLaboratoryOrdersResponseDto,
} from './dto/laboratory-response.dto';
import { QueryLaboratoryOrdersDto } from './dto/query-laboratory-orders.dto';
import { UpdateLaboratoryOrderDto } from './dto/update-laboratory-order.dto';
import { LaboratoryOrderPdfService } from './laboratory-order-pdf.service';
import { LaboratoryOrdersService } from './laboratory-orders.service';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const idParam = {
  name: 'id',
  type: Number,
  example: 1,
  description: 'id de la orden de laboratorio',
};

const invalidId = {
  type: ErrorResponseDto,
  description: 'El id no es un número entero válido.',
};
const notFound = {
  type: ErrorResponseDto,
  description: 'La orden no existe.',
};
const otherDoctor = {
  type: ErrorResponseDto,
  description: 'La orden pertenece a otro médico.',
};

@ApiTags('laboratory-orders')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Token ausente, inválido o expirado.',
})
@Controller('api/v1/laboratory-orders')
export class LaboratoryOrdersController {
  constructor(
    private readonly ordersService: LaboratoryOrdersService,
    private readonly pdfService: LaboratoryOrderPdfService,
  ) {}

  @Post()
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Emitir una orden de laboratorio',
    description:
      'Requiere patient_id, doctor_id, issue_date y al menos un examen en tests o custom_tests. Cada ítem de tests ' +
      'trae test_id y category_id: el examen debe existir, estar activo y pertenecer a esa categoría. custom_tests ' +
      'admite exámenes fuera del catálogo. El membrete vigente (del médico o, si no tiene, del centro médico) se ' +
      'copia en la orden.',
  })
  @ApiCreatedResponse({
    description: 'Orden creada.',
    type: LaboratoryOrderResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Campos obligatorios ausentes o inválidos, orden sin exámenes, test_id repetido, inexistente, inactivo o de ' +
      'otra categoría, o paciente/médico/centro/cita inexistente o cita de otro paciente.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Un médico intenta emitir a nombre de otro médico.',
  })
  create(
    @Body() payload: CreateLaboratoryOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.create(payload, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de una orden de laboratorio',
    description:
      'Devuelve la orden completa con sus exámenes del catálogo (con categoría y códigos), exámenes ' +
      'personalizados, estado y resumen de paciente y médico.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Detalle de la orden.',
    type: LaboratoryOrderResponseDto,
  })
  @ApiBadRequestResponse(invalidId)
  @ApiNotFoundResponse(notFound)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Modificar una orden de laboratorio',
    description:
      'Actualización parcial de diagnosis, additional_notes, tests y custom_tests. Si se envía tests o ' +
      'custom_tests, esa lista reemplaza a la anterior; la orden debe conservar al menos un examen. Los exámenes ' +
      'que ya estaban en la orden se aceptan aunque luego se hayan desactivado del catálogo. El estado pasa a ' +
      'EDITED. Una orden SIGNED o CANCELLED no se puede modificar. Solo el médico emisor o una cuenta SA.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Orden actualizada.',
    type: LaboratoryOrderResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'id inválido, cuerpo vacío, la orden quedaría sin exámenes, o exámenes inválidos (repetidos, inexistentes, ' +
      'inactivos o de otra categoría).',
  })
  @ApiForbiddenResponse(otherDoctor)
  @ApiNotFoundResponse(notFound)
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'La orden está firmada o anulada (o cambió de estado en paralelo).',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateLaboratoryOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.update(id, payload, user);
  }

  @Patch(':id/sign')
  @ApiOperation({
    summary: 'Firmar una orden de laboratorio',
    description:
      'Pasa la orden de ACTIVE/EDITED a SIGNED. Una orden firmada ya no se puede modificar, solo anular. ' +
      'Solo el médico emisor o una cuenta SA.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Orden firmada (status SIGNED).',
    type: LaboratoryOrderResponseDto,
  })
  @ApiBadRequestResponse(invalidId)
  @ApiForbiddenResponse(otherDoctor)
  @ApiNotFoundResponse(notFound)
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'La orden ya está firmada o anulada.',
  })
  sign(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.sign(id, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Anular una orden de laboratorio',
    description:
      'Pasa la orden a CANCELLED (también si estaba firmada). El registro se conserva y su PDF sale marcado ' +
      'como ANULADA. Solo el médico emisor o una cuenta SA.',
  })
  @ApiParam(idParam)
  @ApiOkResponse({
    description: 'Orden anulada (status CANCELLED).',
    type: LaboratoryOrderResponseDto,
  })
  @ApiBadRequestResponse(invalidId)
  @ApiForbiddenResponse(otherDoctor)
  @ApiNotFoundResponse(notFound)
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'La orden ya está anulada.',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.cancel(id, user);
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'PDF imprimible de la orden',
    description:
      'Devuelve el documento en binario (application/pdf, tamaño carta). Header: imagen de membrete desde BD ' +
      '(la guardada en la orden, si no la del médico, si no la del centro; PNG o JPEG) o, si no hay, nombre y ' +
      'especialidad del médico. Cuerpo: datos del paciente, fecha de emisión, diagnóstico, exámenes agrupados por ' +
      'categoría e indicaciones pre-analíticas. Footer: línea de firma y sello con registro médico y colegiatura, ' +
      'y en cada página dirección, teléfonos, correo y paginación. Se muestra inline en el navegador.',
  })
  @ApiParam(idParam)
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Documento PDF.',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse(invalidId)
  @ApiNotFoundResponse(notFound)
  async getPdf(@Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.getOrderOrFail(id);
    const pdf = await this.pdfService.render(order);

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `inline; filename="orden-laboratorio-${id}.pdf"`,
      length: pdf.length,
    });
  }
}

@ApiTags('laboratory-orders')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Token ausente, inválido o expirado.',
})
@Controller('api/v1/patients/:patientId/laboratory-orders')
export class PatientLaboratoryOrdersController {
  constructor(private readonly ordersService: LaboratoryOrdersService) {}

  @Get()
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Historial de órdenes de laboratorio de un paciente',
    description:
      'Lista paginada, ordenada por fecha de emisión descendente (y por creación dentro del mismo día).',
  })
  @ApiParam({
    name: 'patientId',
    type: Number,
    example: 1,
    description: 'id del paciente',
  })
  @ApiOkResponse({
    description: 'Página de órdenes del paciente.',
    type: PaginatedLaboratoryOrdersResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'patientId o parámetros de paginación inválidos.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El paciente no existe.',
  })
  findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: QueryLaboratoryOrdersDto,
  ) {
    return this.ordersService.findByPatient(patientId, query);
  }
}
