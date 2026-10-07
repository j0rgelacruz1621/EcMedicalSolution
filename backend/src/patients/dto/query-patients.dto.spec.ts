import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryPatientsDto } from './query-patients.dto';

describe('QueryPatientsDto', () => {
  const parse = async (query: Record<string, string>) => {
    const dto = plainToInstance(QueryPatientsDto, query);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return { dto, invalid: errors.map((error) => error.property) };
  };

  it('accepts an empty query', async () => {
    expect((await parse({})).invalid).toEqual([]);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses isActive=%s as a boolean', async (raw, expected) => {
    const { dto, invalid } = await parse({ isActive: raw });

    expect(invalid).toEqual([]);
    expect(dto.isActive).toBe(expected);
  });

  it('rejects an isActive that is not true or false', async () => {
    expect((await parse({ isActive: 'yes' })).invalid).toEqual(['isActive']);
  });

  it('converts page and limit to numbers', async () => {
    const { dto, invalid } = await parse({ page: '2', limit: '25' });

    expect(invalid).toEqual([]);
    expect(dto).toEqual(expect.objectContaining({ page: 2, limit: 25 }));
  });

  it.each(['0', '-1', 'abc', '1.5'])('rejects page=%s', async (page) => {
    expect((await parse({ page })).invalid).toEqual(['page']);
  });

  it('rejects unknown query params', async () => {
    expect((await parse({ foo: 'bar' })).invalid).toEqual(['foo']);
  });
});
