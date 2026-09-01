import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Page of results matching the query.',
  })
  data: T[];

  @ApiProperty({ example: 1, description: 'Current page number.' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of records per page.' })
  limit: number;

  @ApiProperty({
    example: 45,
    description: 'Total number of records matching the query.',
  })
  total: number;

  @ApiProperty({ example: 5, description: 'Total number of pages.' })
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.max(1, Math.ceil(total / limit));
  }
}
