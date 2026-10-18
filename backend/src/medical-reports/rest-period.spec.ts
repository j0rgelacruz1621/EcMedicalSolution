import { BadRequestException } from '@nestjs/common';
import { mergeRestPeriodChanges, resolveRestPeriod } from './rest-period';

const d = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('resolveRestPeriod', () => {
  it('computes rest_days counting both dates', () => {
    expect(
      resolveRestPeriod('REPOSO_MEDICO', {
        rest_start_date: '2026-10-08',
        rest_end_date: '2026-10-11',
      }),
    ).toEqual({
      restStartDate: d('2026-10-08'),
      restEndDate: d('2026-10-11'),
      restDays: 4,
    });
  });

  it('computes rest_end_date from rest_days', () => {
    expect(
      resolveRestPeriod('REPOSO_MEDICO', {
        rest_start_date: '2026-10-30',
        rest_days: 3,
      }).restEndDate,
    ).toEqual(d('2026-11-01'));
  });

  it('accepts a single-day rest', () => {
    expect(
      resolveRestPeriod('REPOSO_MEDICO', {
        rest_start_date: '2026-10-08',
        rest_end_date: '2026-10-08',
        rest_days: 1,
      }).restDays,
    ).toBe(1);
  });

  it.each([
    [{ rest_end_date: '2026-10-11' }, /rest_start_date is required/],
    [{ rest_start_date: '2026-10-08' }, /rest_end_date or rest_days/],
    [
      { rest_start_date: '2026-10-08', rest_end_date: '2026-10-07' },
      /on or after rest_start_date/,
    ],
    [
      {
        rest_start_date: '2026-10-08',
        rest_end_date: '2026-10-11',
        rest_days: 3,
      },
      /which is 4 day\(s\)/,
    ],
  ])('rejects an incoherent REPOSO_MEDICO period %#', (input, message) => {
    expect(() => resolveRestPeriod('REPOSO_MEDICO', input)).toThrow(message);
  });

  it('rejects rest fields on other document types', () => {
    expect(() =>
      resolveRestPeriod('CONSTANCIA_ASISTENCIA', { rest_days: 2 }),
    ).toThrow(BadRequestException);
  });

  it('returns an empty period for other document types', () => {
    expect(resolveRestPeriod('INFORME_MEDICO', {})).toEqual({
      restStartDate: null,
      restEndDate: null,
      restDays: null,
    });
  });
});

describe('mergeRestPeriodChanges', () => {
  const current = {
    restStartDate: d('2026-10-08'),
    restEndDate: d('2026-10-11'),
    restDays: 4,
  };

  it('recomputes the end date when only rest_days changes', () => {
    expect(mergeRestPeriodChanges(current, { rest_days: 6 })).toEqual({
      rest_start_date: '2026-10-08',
      rest_end_date: null,
      rest_days: 6,
    });
  });

  it('recomputes the days when only rest_end_date changes', () => {
    expect(
      mergeRestPeriodChanges(current, { rest_end_date: '2026-10-09' }),
    ).toEqual({
      rest_start_date: '2026-10-08',
      rest_end_date: '2026-10-09',
      rest_days: null,
    });
  });

  it('shifts the period keeping the days when only the start changes', () => {
    const merged = mergeRestPeriodChanges(current, {
      rest_start_date: '2026-10-10',
    });

    expect(resolveRestPeriod('REPOSO_MEDICO', merged)).toEqual({
      restStartDate: d('2026-10-10'),
      restEndDate: d('2026-10-13'),
      restDays: 4,
    });
  });
});
