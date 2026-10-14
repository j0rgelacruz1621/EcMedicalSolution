-- Parche final: FK de doctors hacia offices y normalización de day_of_week a enum
-- Idempotente.

-- FK doctors.office_id (ON DELETE SET NULL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_doctors_office') THEN
        ALTER TABLE "doctors"
            ADD CONSTRAINT "fk_doctors_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id")
            ON DELETE SET NULL;
    END IF;
END $$;

-- day_of_week: varchar -> day_of_week_enum (los valores existentes ya son nombres del enum)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctor_schedules' AND column_name = 'day_of_week' AND data_type IN ('text', 'character varying')
    ) THEN
        ALTER TABLE "doctor_schedules"
            ALTER COLUMN "day_of_week" DROP DEFAULT,
            ALTER COLUMN "day_of_week" TYPE "day_of_week_enum"
            USING "day_of_week"::text::"day_of_week_enum";
    END IF;
END $$;
