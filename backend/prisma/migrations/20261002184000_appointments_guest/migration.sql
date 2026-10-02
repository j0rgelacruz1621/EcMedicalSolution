-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "fk_appointments_patient";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "guest_age" INTEGER,
ADD COLUMN     "guest_email" VARCHAR(150),
ADD COLUMN     "guest_first_name" VARCHAR(100),
ADD COLUMN     "guest_gender" "gender_enum",
ADD COLUMN     "guest_last_name" VARCHAR(100),
ADD COLUMN     "guest_national_id" VARCHAR(30),
ADD COLUMN     "guest_phone" VARCHAR(20),
ALTER COLUMN "patient_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

