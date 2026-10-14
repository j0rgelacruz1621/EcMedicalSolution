-- HU: Citas — tipo de cita como texto libre
-- Idempotente: agrega la columna type (VARCHAR) que el código ya usa,
-- con default 'De primera' para las filas existentes.

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "type" VARCHAR DEFAULT 'De primera';
