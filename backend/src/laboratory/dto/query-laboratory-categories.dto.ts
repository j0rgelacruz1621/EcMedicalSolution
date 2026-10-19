import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryLaboratoryCategoriesDto {
  @ApiPropertyOptional({
    description:
      'Por defecto solo se listan categorías y exámenes activos. Con true se incluyen también los inactivos.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === true || value === 'true'
      ? true
      : value === false || value === 'false'
        ? false
        : value,
  )
  @IsBoolean()
  include_inactive?: boolean;
}
