-- HU: Órdenes de Laboratorio
-- Catálogo (categorías + exámenes) y órdenes de laboratorio con ítems catalogados y personalizados.

-- ============================================================================
-- Catálogo: categorías de exámenes
-- ============================================================================
CREATE TABLE "laboratory_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratory_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "laboratory_categories_name_key" ON "laboratory_categories"("name");

-- ============================================================================
-- Catálogo: exámenes de laboratorio
-- ============================================================================
CREATE TABLE "laboratory_tests" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "internal_code" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "loinc_code" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratory_tests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "laboratory_tests_category_id_idx" ON "laboratory_tests"("category_id");

ALTER TABLE "laboratory_tests" ADD CONSTRAINT "fk_laboratory_tests_category" FOREIGN KEY ("category_id") REFERENCES "laboratory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Órdenes de laboratorio
-- ============================================================================
CREATE TABLE "laboratory_orders" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "doctor_id" BIGINT NOT NULL,
    "medical_center_id" BIGINT,
    "appointment_id" BIGINT,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "diagnosis" VARCHAR(500),
    "additional_notes" TEXT,
    "header_image_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratory_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "laboratory_orders_patient_id_issue_date_idx" ON "laboratory_orders"("patient_id", "issue_date" DESC);
CREATE INDEX "laboratory_orders_doctor_id_issue_date_idx" ON "laboratory_orders"("doctor_id", "issue_date");
CREATE INDEX "laboratory_orders_status_idx" ON "laboratory_orders"("status");

ALTER TABLE "laboratory_orders" ADD CONSTRAINT "fk_laboratory_orders_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "laboratory_orders" ADD CONSTRAINT "fk_laboratory_orders_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "laboratory_orders" ADD CONSTRAINT "fk_laboratory_orders_medical_center" FOREIGN KEY ("medical_center_id") REFERENCES "medical_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "laboratory_orders" ADD CONSTRAINT "fk_laboratory_orders_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Ítems de orden: exámenes del catálogo
-- ============================================================================
CREATE TABLE "laboratory_order_tests" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "test_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratory_order_tests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "laboratory_order_tests_order_id_idx" ON "laboratory_order_tests"("order_id", "sort_order");

ALTER TABLE "laboratory_order_tests" ADD CONSTRAINT "fk_lot_order" FOREIGN KEY ("order_id") REFERENCES "laboratory_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "laboratory_order_tests" ADD CONSTRAINT "fk_lot_test" FOREIGN KEY ("test_id") REFERENCES "laboratory_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "laboratory_order_tests" ADD CONSTRAINT "fk_lot_category" FOREIGN KEY ("category_id") REFERENCES "laboratory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Ítems de orden: exámenes personalizados/libres (no catalogados)
-- ============================================================================
CREATE TABLE "laboratory_order_custom_tests" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "category_name" VARCHAR(100),
    "test_name" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratory_order_custom_tests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "laboratory_order_custom_tests_order_id_idx" ON "laboratory_order_custom_tests"("order_id", "sort_order");

ALTER TABLE "laboratory_order_custom_tests" ADD CONSTRAINT "fk_loct_order" FOREIGN KEY ("order_id") REFERENCES "laboratory_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Triggers: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION set_laboratory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_laboratory_categories_updated_at
    BEFORE UPDATE ON "laboratory_categories"
    FOR EACH ROW EXECUTE FUNCTION set_laboratory_updated_at();

CREATE TRIGGER trg_laboratory_tests_updated_at
    BEFORE UPDATE ON "laboratory_tests"
    FOR EACH ROW EXECUTE FUNCTION set_laboratory_updated_at();

CREATE TRIGGER trg_laboratory_orders_updated_at
    BEFORE UPDATE ON "laboratory_orders"
    FOR EACH ROW EXECUTE FUNCTION set_laboratory_updated_at();

-- ============================================================================
-- Trigger: una orden debe tener al menos un ítem (catálogo o personalizado)
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_laboratory_order_items()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT (SELECT COUNT(*) FROM laboratory_order_tests WHERE order_id = NEW.id)
         + (SELECT COUNT(*) FROM laboratory_order_custom_tests WHERE order_id = NEW.id)
    INTO v_count;

    IF v_count = 0 THEN
        RAISE EXCEPTION 'La orden de laboratorio debe contener al menos un examen (test o custom_test)'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_laboratory_order_items
    AFTER INSERT ON "laboratory_orders"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION validate_laboratory_order_items();
