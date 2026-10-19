-- HU: Catálogo de exámenes y órdenes de laboratorio (API + PDF)
-- Complementa 20261008140000_laboratory_module con reglas de integridad.
-- Script idempotente: se puede ejecutar más de una vez.

BEGIN;

-- ============================================================================
-- Estados válidos de la orden (control de auditoría, criterio 2.4)
-- ACTIVE: emitida · EDITED: modificada · SIGNED: firmada, ya no se modifica ·
-- CANCELLED: anulada.
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_laboratory_orders_status') THEN
        ALTER TABLE "laboratory_orders"
            ADD CONSTRAINT "chk_laboratory_orders_status"
            CHECK ("status" IN ('ACTIVE', 'EDITED', 'SIGNED', 'CANCELLED'));
    END IF;
END $$;

-- ============================================================================
-- Catálogo sin duplicados
-- El código interno es único en todo el catálogo (sin distinguir mayúsculas) y
-- el nombre de un examen es único dentro de su categoría.
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "laboratory_tests_internal_code_key"
    ON "laboratory_tests" (upper("internal_code"))
    WHERE "internal_code" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "laboratory_tests_category_id_name_key"
    ON "laboratory_tests" ("category_id", lower("name"));

COMMIT;
