-- HU: Perfil del médico (género, descripción, RIF, CM, foto y membrete)
-- Idempotente: agrega a doctors/medical_centers las columnas que el código ya usa
-- y que la BD de Supabase aún no tiene.

-- ============================================================================
-- doctors
-- ============================================================================
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "gender" "gender_enum";
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "rif" VARCHAR(20);
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "cm_number" VARCHAR(50);
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "header_image_url" TEXT;

-- ============================================================================
-- medical_centers
-- ============================================================================
ALTER TABLE "medical_centers" ADD COLUMN IF NOT EXISTS "header_image_url" TEXT;
