-- HU: Pacientes — age opcional y médico asignado
-- Idempotente: age pasa a nullable (el código ya permite pacientes sin edad)
-- y se agrega el FK hacia doctors (assigned_doctor_id).

-- age: de NOT NULL a nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'age' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "patients" ALTER COLUMN "age" DROP NOT NULL;
    END IF;
END $$;

-- assigned_doctor_id (columna + FK)
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "assigned_doctor_id" BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_patients_assigned_doctor'
    ) THEN
        ALTER TABLE "patients"
            ADD CONSTRAINT "fk_patients_assigned_doctor"
            FOREIGN KEY ("assigned_doctor_id") REFERENCES "doctors"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
