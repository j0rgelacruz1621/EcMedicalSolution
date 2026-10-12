-- HU: Informes de Reposo / Constancias Médicas
-- Tabla de informes médicos (reposo, constancia de asistencia, informe general).

-- Enum de tipo de documento
CREATE TYPE "medical_report_type_enum" AS ENUM ('REPOSO_MEDICO', 'CONSTANCIA_ASISTENCIA', 'INFORME_MEDICO');

-- Enum de estado (control de flujo / firma)
CREATE TYPE "medical_report_status_enum" AS ENUM ('ACTIVE', 'EDITED', 'SIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "doctor_id" BIGINT NOT NULL,
    "medical_center_id" BIGINT,
    "appointment_id" BIGINT,
    "title" VARCHAR(200) NOT NULL,
    "type" "medical_report_type_enum" NOT NULL DEFAULT 'INFORME_MEDICO',
    "description" VARCHAR(500),
    "content" TEXT NOT NULL,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "rest_start_date" DATE,
    "rest_end_date" DATE,
    "rest_days" INTEGER,
    "diagnosis_code" VARCHAR(20),
    "diagnosis" VARCHAR(500),
    "header_image_url" TEXT,
    "status" "medical_report_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_reports_patient_id_issue_date_idx" ON "medical_reports"("patient_id", "issue_date");
CREATE INDEX "medical_reports_doctor_id_issue_date_idx" ON "medical_reports"("doctor_id", "issue_date");
CREATE INDEX "medical_reports_type_idx" ON "medical_reports"("type");
CREATE INDEX "medical_reports_status_idx" ON "medical_reports"("status");

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "fk_medical_reports_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "fk_medical_reports_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "fk_medical_reports_medical_center" FOREIGN KEY ("medical_center_id") REFERENCES "medical_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "fk_medical_reports_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Trigger: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION set_medical_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medical_reports_updated_at
    BEFORE UPDATE ON "medical_reports"
    FOR EACH ROW
    EXECUTE FUNCTION set_medical_reports_updated_at();

-- ============================================================================
-- Trigger: coherencia de fechas de reposo (criterio 1.2)
-- rest_end_date >= rest_start_date; si no se cumple, rechaza el INSERT/UPDATE.
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_medical_report_rest_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rest_start_date IS NOT NULL AND NEW.rest_end_date IS NOT NULL
       AND NEW.rest_end_date < NEW.rest_start_date THEN
        RAISE EXCEPTION 'rest_end_date no puede ser anterior a rest_start_date'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medical_reports_rest_dates
    BEFORE INSERT OR UPDATE ON "medical_reports"
    FOR EACH ROW
    EXECUTE FUNCTION validate_medical_report_rest_dates();

-- ============================================================================
-- Trigger: cálculo automático de rest_days (si no viene explícito)
-- ============================================================================
CREATE OR REPLACE FUNCTION calc_medical_report_rest_days()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rest_start_date IS NOT NULL AND NEW.rest_end_date IS NOT NULL AND NEW.rest_days IS NULL THEN
        NEW.rest_days := (NEW.rest_end_date - NEW.rest_start_date) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medical_reports_calc_rest_days
    BEFORE INSERT OR UPDATE ON "medical_reports"
    FOR EACH ROW
    EXECUTE FUNCTION calc_medical_report_rest_days();
