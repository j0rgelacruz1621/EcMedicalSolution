import { BadRequestException } from '@nestjs/common';
import { medical_report_type_enum } from '@prisma/client';
import {
  parseDateOnly,
  toDateOnly,
} from '../common/documents/printable-document';

// Reglas del período de reposo (criterio 1.2).
// Convención: los días cuentan inicio y fin (del 08 al 11 = 4 días), igual que
// el trigger calc_medical_report_rest_days de la BD.

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RestPeriodInput {
  rest_start_date?: string | null;
  rest_end_date?: string | null;
  rest_days?: number | null;
}

export interface RestPeriod {
  restStartDate: Date | null;
  restEndDate: Date | null;
  restDays: number | null;
}

const EMPTY_PERIOD: RestPeriod = {
  restStartDate: null,
  restEndDate: null,
  restDays: null,
};

function hasRestFields(input: RestPeriodInput) {
  return (
    input.rest_start_date != null ||
    input.rest_end_date != null ||
    input.rest_days != null
  );
}

export function resolveRestPeriod(
  type: medical_report_type_enum,
  input: RestPeriodInput,
): RestPeriod {
  if (type !== 'REPOSO_MEDICO') {
    if (hasRestFields(input)) {
      throw new BadRequestException(
        'rest_start_date, rest_end_date and rest_days are only allowed for REPOSO_MEDICO.',
      );
    }
    return EMPTY_PERIOD;
  }

  const { rest_start_date: start, rest_end_date: end, rest_days: days } = input;

  if (!start) {
    throw new BadRequestException(
      'rest_start_date is required for REPOSO_MEDICO.',
    );
  }

  if (!end && days == null) {
    throw new BadRequestException(
      'REPOSO_MEDICO requires rest_end_date or rest_days.',
    );
  }

  const startDate = parseDateOnly(start);

  if (end) {
    const endDate = parseDateOnly(end);

    if (endDate < startDate) {
      throw new BadRequestException(
        'rest_end_date must be on or after rest_start_date.',
      );
    }

    const periodDays =
      Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;

    if (days != null && days !== periodDays) {
      throw new BadRequestException(
        `rest_days (${days}) does not match the period ${start} → ${end}, which is ${periodDays} day(s) counting both dates.`,
      );
    }

    return {
      restStartDate: startDate,
      restEndDate: endDate,
      restDays: periodDays,
    };
  }

  const endDate = new Date(startDate.getTime() + (days! - 1) * DAY_MS);
  return { restStartDate: startDate, restEndDate: endDate, restDays: days! };
}

// Al editar, combina el período guardado con los cambios: el campo que el
// usuario no envía se recalcula a partir de los que sí envía.
export function mergeRestPeriodChanges(
  current: RestPeriod,
  changes: RestPeriodInput,
): RestPeriodInput {
  const touchesEnd = changes.rest_end_date !== undefined;
  const touchesDays = changes.rest_days !== undefined;

  const merged: RestPeriodInput = {
    rest_start_date:
      changes.rest_start_date ??
      (current.restStartDate ? toDateOnly(current.restStartDate) : null),
    rest_end_date: current.restEndDate ? toDateOnly(current.restEndDate) : null,
    rest_days: current.restDays,
  };

  if (touchesEnd && touchesDays) {
    merged.rest_end_date = changes.rest_end_date;
    merged.rest_days = changes.rest_days;
  } else if (touchesDays) {
    merged.rest_days = changes.rest_days;
    merged.rest_end_date = null;
  } else if (touchesEnd) {
    merged.rest_end_date = changes.rest_end_date;
    merged.rest_days = null;
  } else if (changes.rest_start_date !== undefined) {
    // Cambia solo el inicio: el período se desplaza conservando los días.
    merged.rest_end_date = null;
  }

  return merged;
}
