import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  RecipeDocumentResponseDto,
  RecipeResponseDto,
} from './dto/recipe-response.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@Controller('api/v1/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Emitir un récipe médico',
    description:
      'Registra el récipe asociado al paciente y al médico firmante. Requiere al menos un medicamento con nombre. ' +
      'El membrete vigente (del médico o, si no tiene, del centro médico) se copia en el récipe para que las ' +
      'reimpresiones conserven la identidad gráfica con la que fue emitido. Tras crearlo, el cliente debe pedir ' +
      '`GET /api/v1/recipes/{id}/document` para generar el documento imprimible.',
  })
  @ApiCreatedResponse({
    description: 'Récipe creado.',
    type: RecipeResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos: sin medicamentos, fármaco sin nombre, indicaciones de más de 500 caracteres, ' +
      'paciente/médico/centro/cita inexistente, cita de otro paciente, o cuenta SA sin doctor_id.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no es médico ni SA, o un médico intenta emitir con otro doctor_id.',
  })
  create(@Body() payload: CreateRecipeDto, @CurrentUser() user: RequestUser) {
    return this.recipesService.create(payload, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar un récipe',
    description:
      'Devuelve cualquier versión del récipe, incluidas las reemplazadas por una edición.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'recipe_id' })
  @ApiOkResponse({ type: RecipeResponseDto })
  @ApiNotFoundResponse({ description: 'El récipe no existe.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.findOne(id);
  }

  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Editar un récipe (con versionado)',
    description:
      'Reemplaza los medicamentos y las indicaciones. No sobrescribe el registro: la versión actual queda como ' +
      '`status=EDITED`, `version_type=SUPERSEDED`, y se crea un récipe nuevo con `supersedes_recipe_id` apuntando ' +
      'a ella. Paciente, médico, fecha de emisión y membrete se conservan. Solo se puede editar la versión ' +
      'vigente (ACTIVE), y solo el médico que la emitió o una cuenta SA. Devuelve la nueva versión.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'recipe_id de la versión vigente',
  })
  @ApiOkResponse({
    description: 'Nueva versión del récipe.',
    type: RecipeResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos: sin medicamentos, fármaco sin nombre o indicaciones de más de 500 caracteres.',
  })
  @ApiForbiddenResponse({ description: 'El récipe pertenece a otro médico.' })
  @ApiNotFoundResponse({ description: 'El récipe no existe.' })
  @ApiConflictResponse({
    description:
      'La versión ya fue reemplazada o anulada, o hubo una edición simultánea. Recargar y reintentar sobre la versión vigente.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateRecipeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.recipesService.update(id, payload, user);
  }

  @Get(':id/document')
  @ApiOperation({
    summary: 'Datos del documento imprimible',
    description:
      'Devuelve todo lo necesario para renderizar o imprimir el récipe: header (membrete), el récipe con ' +
      'paciente, fecha, medicamentos e indicaciones, y footer (dirección, teléfonos, registro médico y C.M.).',
  })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'recipe_id' })
  @ApiOkResponse({ type: RecipeDocumentResponseDto })
  @ApiNotFoundResponse({ description: 'El récipe no existe.' })
  getDocument(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.getPrintableDocument(id);
  }
}
