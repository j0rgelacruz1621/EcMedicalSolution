-- HU: Emitir Récipe Médico (CRUD + documento imprimible)
-- Script idempotente: puede ejecutarse aunque 20261008120000_recipes_module ya se haya
-- aplicado (o no). Crea lo que falte y agrega la configuración de membrete por médico
-- y por centro médico, que el servicio de documento usa como header del récipe.

BEGIN;

-- ============================================================================
-- Enums
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recipe_status_enum') THEN
        CREATE TYPE "recipe_status_enum" AS ENUM ('ACTIVE', 'EDITED', 'CANCELLED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recipe_version_type_enum') THEN
        CREATE TYPE "recipe_version_type_enum" AS ENUM ('ORIGINAL', 'SUPERSEDED');
    END IF;
END $$;

-- ============================================================================
-- Tablas de récipes (si no existen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "recipes" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "doctor_id" BIGINT NOT NULL,
    "medical_center_id" BIGINT,
    "appointment_id" BIGINT,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "header_image_url" TEXT,
    "additional_instructions" VARCHAR(500),
    "status" "recipe_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "version_type" "recipe_version_type_enum" NOT NULL DEFAULT 'ORIGINAL',
    "supersedes_recipe_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_recipes_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_recipes_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fk_recipes_medical_center" FOREIGN KEY ("medical_center_id") REFERENCES "medical_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_recipes_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_recipes_supersedes" FOREIGN KEY ("supersedes_recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "recipe_medications" (
    "id" BIGSERIAL NOT NULL,
    "recipe_id" BIGINT NOT NULL,
    "drug_name" VARCHAR(150) NOT NULL,
    "presentation" VARCHAR(100),
    "dose" VARCHAR(100),
    "frequency" VARCHAR(100),
    "duration" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_medications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_recipe_medications_recipe" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "recipes_patient_id_issue_date_idx" ON "recipes"("patient_id", "issue_date");
CREATE INDEX IF NOT EXISTS "recipes_doctor_id_issue_date_idx" ON "recipes"("doctor_id", "issue_date");
CREATE INDEX IF NOT EXISTS "recipes_status_idx" ON "recipes"("status");
CREATE INDEX IF NOT EXISTS "recipes_supersedes_recipe_id_idx" ON "recipes"("supersedes_recipe_id");
CREATE INDEX IF NOT EXISTS "recipe_medications_recipe_id_sort_order_idx" ON "recipe_medications"("recipe_id", "sort_order");

-- Validaciones a nivel de BD (criterios 3.2 y campo obligatorio del fármaco)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recipe_medications_drug_name') THEN
        ALTER TABLE "recipe_medications"
            ADD CONSTRAINT "chk_recipe_medications_drug_name" CHECK (length(btrim("drug_name")) > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_recipes_not_self_supersede') THEN
        ALTER TABLE "recipes"
            ADD CONSTRAINT "chk_recipes_not_self_supersede" CHECK ("supersedes_recipe_id" IS NULL OR "supersedes_recipe_id" <> "id");
    END IF;
END $$;

-- updated_at automático
CREATE OR REPLACE FUNCTION set_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON "recipes";
CREATE TRIGGER trg_recipes_updated_at
    BEFORE UPDATE ON "recipes"
    FOR EACH ROW
    EXECUTE FUNCTION set_recipes_updated_at();

-- ============================================================================
-- Membrete (header) configurable por médico y por centro médico (criterio 5.2)
-- Prioridad al emitir: membrete del médico > membrete del centro médico.
-- El valor resuelto se copia en recipes.header_image_url para que los récipes
-- históricos conserven el membrete con el que fueron emitidos.
-- ============================================================================
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "header_image_url" TEXT;
ALTER TABLE "medical_centers" ADD COLUMN IF NOT EXISTS "header_image_url" TEXT;

-- ============================================================================
-- Storage: bucket para imágenes de membrete
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-headers', 'recipe-headers', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'recipe_headers_public_read') THEN
        CREATE POLICY "recipe_headers_public_read" ON storage.objects
            FOR SELECT USING (bucket_id = 'recipe-headers');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'recipe_headers_service_write') THEN
        CREATE POLICY "recipe_headers_service_write" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'recipe-headers');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'recipe_headers_service_update') THEN
        CREATE POLICY "recipe_headers_service_update" ON storage.objects
            FOR UPDATE USING (bucket_id = 'recipe-headers');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'recipe_headers_service_delete') THEN
        CREATE POLICY "recipe_headers_service_delete" ON storage.objects
            FOR DELETE USING (bucket_id = 'recipe-headers');
    END IF;
END $$;

COMMIT;
