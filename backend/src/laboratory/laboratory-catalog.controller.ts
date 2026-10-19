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
import { Roles } from '../auth/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateLaboratoryCategoryDto } from './dto/create-laboratory-category.dto';
import { CreateLaboratoryTestDto } from './dto/create-laboratory-test.dto';
import {
  LaboratoryCategoryResponseDto,
  LaboratoryTestResponseDto,
} from './dto/laboratory-response.dto';
import { QueryLaboratoryCategoriesDto } from './dto/query-laboratory-categories.dto';
import { UpdateLaboratoryCategoryDto } from './dto/update-laboratory-category.dto';
import { UpdateLaboratoryTestDto } from './dto/update-laboratory-test.dto';
import { LaboratoryCatalogService } from './laboratory-catalog.service';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const adminOnly =
  'Solo cuentas SA (administración del catálogo). Requiere token.';

@ApiTags('laboratory-catalog')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Token ausente, inválido o expirado.',
})
@Controller('api/v1/laboratory-categories')
export class LaboratoryCategoriesController {
  constructor(private readonly catalogService: LaboratoryCatalogService) {}

  @Get()
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Listar categorías con sus exámenes',
    description:
      'Devuelve las categorías ordenadas por nombre, cada una con sus exámenes anidados. Por defecto solo las ' +
      'categorías y exámenes activos; con include_inactive=true, todos.',
  })
  @ApiOkResponse({
    description: 'Catálogo de laboratorio.',
    type: [LaboratoryCategoryResponseDto],
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'include_inactive no es true/false.',
  })
  findAll(@Query() query: QueryLaboratoryCategoriesDto) {
    return this.catalogService.findCategories(query);
  }

  @Post()
  @Roles('SA')
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Crear categoría de laboratorio',
    description: adminOnly,
  })
  @ApiCreatedResponse({
    description: 'Categoría creada (sin exámenes).',
    type: LaboratoryCategoryResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Nombre ausente o campos con formato inválido.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El usuario no es SA.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Ya existe una categoría con ese nombre (sin distinguir mayúsculas).',
  })
  create(@Body() payload: CreateLaboratoryCategoryDto) {
    return this.catalogService.createCategory(payload);
  }

  @Patch(':id')
  @Roles('SA')
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Modificar o desactivar una categoría',
    description:
      `${adminOnly} Con is_active=false la categoría y sus exámenes dejan de ofrecerse para nuevas órdenes; ` +
      'las órdenes ya emitidas no cambian.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'id de la categoría',
  })
  @ApiOkResponse({
    description: 'Categoría actualizada, con todos sus exámenes.',
    type: LaboratoryCategoryResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id inválido, cuerpo vacío o campos con formato inválido.',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'El usuario no es SA.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'La categoría no existe.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Ya existe otra categoría con ese nombre.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateLaboratoryCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, payload);
  }
}

@ApiTags('laboratory-catalog')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Token ausente, inválido o expirado.',
})
@ApiForbiddenResponse({
  type: ErrorResponseDto,
  description: 'El usuario no es SA.',
})
@Roles('SA')
@Controller('api/v1/laboratory-tests')
export class LaboratoryTestsController {
  constructor(private readonly catalogService: LaboratoryCatalogService) {}

  @Post()
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Crear examen en una categoría',
    description:
      `${adminOnly} internal_code es único en el catálogo y el nombre es único dentro de la categoría ` +
      '(ambos sin distinguir mayúsculas). internal_code y loinc_code se guardan en mayúsculas.',
  })
  @ApiCreatedResponse({
    description: 'Examen creado.',
    type: LaboratoryTestResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'category_id o name ausentes, formato inválido o la categoría no existe.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Ya existe un examen con ese internal_code, o con ese nombre en la categoría.',
  })
  create(@Body() payload: CreateLaboratoryTestDto) {
    return this.catalogService.createTest(payload);
  }

  @Patch(':id')
  @UsePipes(validationPipe)
  @ApiOperation({
    summary: 'Modificar, mover o desactivar un examen',
    description:
      `${adminOnly} Con is_active=false el examen deja de ofrecerse para nuevas órdenes; las órdenes ya ` +
      'emitidas no cambian.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 3,
    description: 'id del examen',
  })
  @ApiOkResponse({
    description: 'Examen actualizado.',
    type: LaboratoryTestResponseDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'id inválido, cuerpo vacío, formato inválido o la categoría destino no existe.',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'El examen no existe.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Otro examen ya usa ese internal_code, o ese nombre en la categoría.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateLaboratoryTestDto,
  ) {
    return this.catalogService.updateTest(id, payload);
  }
}
