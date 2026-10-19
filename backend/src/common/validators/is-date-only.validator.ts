import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

// Fecha calendario estricta en formato YYYY-MM-DD que además exista
// (rechaza 2026-02-30 y fechas con hora).
export const IsDateOnly = () =>
  applyDecorators(
    IsISO8601(
      { strict: true },
      { message: ({ property }) => `${property} must be a valid date.` },
    ),
    Matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: ({ property }) => `${property} must be YYYY-MM-DD.`,
    }),
  );
