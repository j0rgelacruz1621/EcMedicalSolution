import { ApiProperty } from '@nestjs/swagger';

// Forma estándar de los errores HTTP de NestJS, para documentarla en Swagger.
export class ErrorResponseDto {
  @ApiProperty({ description: 'Código HTTP del error.', example: 400 })
  statusCode: number;

  @ApiProperty({
    description:
      'Detalle del error. En errores de validación es una lista con un mensaje por regla incumplida.',
    oneOf: [
      { type: 'string', example: 'Medical report not found.' },
      {
        type: 'array',
        items: { type: 'string' },
        example: [
          'title should not be empty',
          'issue_date must be YYYY-MM-DD.',
        ],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Nombre del error HTTP.',
    example: 'Bad Request',
  })
  error: string;
}
