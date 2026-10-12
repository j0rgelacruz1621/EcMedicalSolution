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
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { PaginatedRecipesResponseDto } from './dto/recipe-response.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@Controller('api/v1/patients/:patientId/recipes')
export class PatientRecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Historial de récipes de un paciente',
    description:
      'Lista los récipes del paciente, del más reciente al más antiguo, con fecha, médico emisor y desglose de ' +
      'medicamentos. Por defecto solo incluye las versiones vigentes; usar `include_history=true` para ver también ' +
      'las versiones reemplazadas por ediciones.',
  })
  @ApiParam({ name: 'patientId', type: Number, example: 1 })
  @ApiOkResponse({ type: PaginatedRecipesResponseDto })
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos.' })
  @ApiNotFoundResponse({ description: 'El paciente no existe.' })
  findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: QueryRecipesDto,
  ) {
    return this.recipesService.findByPatient(patientId, query);
  }
}
