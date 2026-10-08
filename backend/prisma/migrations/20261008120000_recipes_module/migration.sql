-- HU: Emitir Récipe Médico
-- Tabla principal de récipes + detalle de medicamentos + bucket de Storage para membretes.

-- Enum de estado del récipe
CREATE TYPE "recipe_status_enum" AS ENUM ('ACTIVE', 'EDITED', 'CANCELLED');

-- Enum de versión (control de auditoría/versionado)
-- Un récipe nuevo nace como ORIGINAL; cuando se edita, la versión previa queda marcada
-- como SUPERSEDED y se crea una fila nueva apuntando a la original.
CREATE TYPE "recipe_version_type_enum" AS ENUM ('ORIGINAL', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "recipes" (
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

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable (ítems dinámicos de medicamento)
CREATE TABLE "recipe_medications" (
    "id" BIGSERIAL NOT NULL,
    "recipe_id" BIGINT NOT NULL,
    "drug_name" VARCHAR(150) NOT NULL,
    "presentation" VARCHAR(100),
    "dose" VARCHAR(100),
    "frequency" VARCHAR(100),
    "duration" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_patient_id_issue_date_idx" ON "recipes"("patient_id", "issue_date");
CREATE INDEX "recipes_doctor_id_issue_date_idx" ON "recipes"("doctor_id", "issue_date");
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- CreateIndex
CREATE INDEX "recipe_medications_recipe_id_sort_order_idx" ON "recipe_medications"("recipe_id", "sort_order");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "fk_recipes_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "fk_recipes_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "fk_recipes_medical_center" FOREIGN KEY ("medical_center_id") REFERENCES "medical_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "fk_recipes_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "fk_recipes_supersedes" FOREIGN KEY ("supersedes_recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_medications" ADD CONSTRAINT "fk_recipe_medications_recipe" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Storage: bucket para imágenes de membrete/encabezado (header de PDF)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-headers', 'recipe-headers', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS del bucket (público para lectura, servicio para escritura)
CREATE POLICY "recipe_headers_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'recipe-headers');

CREATE POLICY "recipe_headers_service_write" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'recipe-headers');

CREATE POLICY "recipe_headers_service_update" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'recipe-headers');

CREATE POLICY "recipe_headers_service_delete" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'recipe-headers');

-- ============================================================================
-- Trigger: updated_at automático en recipes
-- ============================================================================
CREATE OR REPLACE FUNCTION set_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recipes_updated_at
    BEFORE UPDATE ON "recipes"
    FOR EACH ROW
    EXECUTE FUNCTION set_recipes_updated_at();
