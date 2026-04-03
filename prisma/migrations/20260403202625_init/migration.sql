/*
  Warnings:

  - The values [DISTRIBUTION_DONE] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `animal_stock_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `is_payas_eligible` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `masjid_distributes` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `portion_numbers` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `wants_meat` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `animal_stock_id` on the `day_pricing` table. All the data in the column will be lost.
  - You are about to drop the column `day_number` on the `day_pricing` table. All the data in the column will be lost.
  - You are about to drop the column `full_animal_price` on the `day_pricing` table. All the data in the column will be lost.
  - The `status` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `receipt_note` on the `payments` table. All the data in the column will be lost.
  - The `payment_method` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `eid_date` on the `years` table. All the data in the column will be lost.
  - You are about to drop the `animal_stock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `animal_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `distribution_log` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[year_id,animal_config_id,eid_day]` on the table `day_pricing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `animal_config_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eid_day` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_slot_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `animal_config_id` to the `day_pricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eid_day` to the `day_pricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `day_pricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_id` to the `day_pricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Made the column `amount_paid` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `eid_day_1` to the `years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eid_day_2` to the `years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eid_day_3` to the `years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `years` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnimalKind" AS ENUM ('GOAT', 'COW_MALE', 'COW_FEMALE', 'CAMEL');

-- CreateEnum
CREATE TYPE "EidDay" AS ENUM ('DAY_1', 'DAY_2', 'DAY_3');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'SADAPAY', 'NAYAPAY', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "SlipStatus" AS ENUM ('VALID', 'USED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'DRAFT';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'EID_REMINDER', 'SLOT_REMINDER', 'DISTRIBUTION_READY', 'BOOKING_CANCELLED', 'YEARLY_OUTREACH');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- DropForeignKey
ALTER TABLE "animal_stock" DROP CONSTRAINT "animal_stock_animal_type_id_fkey";

-- DropForeignKey
ALTER TABLE "animal_stock" DROP CONSTRAINT "animal_stock_year_id_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_animal_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "day_pricing" DROP CONSTRAINT "day_pricing_animal_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "distribution_log" DROP CONSTRAINT "distribution_log_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "distribution_log" DROP CONSTRAINT "distribution_log_booking_id_fkey";

-- DropIndex
DROP INDEX "day_pricing_animal_stock_id_day_number_key";

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "animal_stock_id",
DROP COLUMN "is_payas_eligible",
DROP COLUMN "masjid_distributes",
DROP COLUMN "portion_numbers",
DROP COLUMN "wants_meat",
ADD COLUMN     "animal_config_id" INTEGER NOT NULL,
ADD COLUMN     "created_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_by_admin_id" INTEGER,
ADD COLUMN     "eid_day" "EidDay" NOT NULL,
ADD COLUMN     "hissa_identifier" TEXT,
ADD COLUMN     "masjid_keeps_meat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payas_granted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payas_note" TEXT,
ADD COLUMN     "time_slot_id" INTEGER NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "wants_payas" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "city" TEXT;

-- AlterTable
ALTER TABLE "day_pricing" DROP COLUMN "animal_stock_id",
DROP COLUMN "day_number",
DROP COLUMN "full_animal_price",
ADD COLUMN     "animal_config_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eid_day" "EidDay" NOT NULL,
ADD COLUMN     "payas_extra_charge" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "year_id" INTEGER NOT NULL,
ALTER COLUMN "price_per_portion" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "error_msg" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "scheduled_for" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "sent_at" DROP NOT NULL,
ALTER COLUMN "sent_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "receipt_note",
ADD COLUMN     "receipt_url" TEXT,
ADD COLUMN     "rejection_note" TEXT,
ADD COLUMN     "transaction_ref" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount_due" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "amount_paid" SET NOT NULL,
ALTER COLUMN "amount_paid" SET DEFAULT 0,
ALTER COLUMN "amount_paid" SET DATA TYPE DECIMAL(12,2),
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "PaymentMethod";

-- AlterTable
ALTER TABLE "years" DROP COLUMN "eid_date",
ADD COLUMN     "eid_day_1" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "eid_day_2" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "eid_day_3" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "animal_stock";

-- DropTable
DROP TABLE "animal_types";

-- DropTable
DROP TABLE "distribution_log";

-- CreateTable
CREATE TABLE "animal_configs" (
    "id" SERIAL NOT NULL,
    "kind" "AnimalKind" NOT NULL,
    "label" TEXT NOT NULL,
    "portions_per_animal" INTEGER NOT NULL,
    "payas_per_animal" INTEGER NOT NULL DEFAULT 4,
    "description" TEXT,

    CONSTRAINT "animal_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_pools" (
    "id" SERIAL NOT NULL,
    "year_id" INTEGER NOT NULL,
    "animal_config_id" INTEGER NOT NULL,
    "total_animals" INTEGER NOT NULL,
    "total_portions" INTEGER NOT NULL,
    "total_payas" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slaughter_schedules" (
    "id" SERIAL NOT NULL,
    "year_id" INTEGER NOT NULL,
    "animal_config_id" INTEGER NOT NULL,
    "eid_day" "EidDay" NOT NULL,
    "animals_count" INTEGER NOT NULL,
    "portions_count" INTEGER NOT NULL,
    "payas_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slaughter_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" SERIAL NOT NULL,
    "year_id" INTEGER NOT NULL,
    "animal_config_id" INTEGER NOT NULL,
    "eid_day" "EidDay" NOT NULL,
    "slot_label" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "animals_assigned" INTEGER NOT NULL,
    "total_portions" INTEGER NOT NULL,
    "total_payas" INTEGER NOT NULL,
    "booked_portions" INTEGER NOT NULL DEFAULT 0,
    "booked_payas" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_slips" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "slip_code" TEXT NOT NULL,
    "pdf_url" TEXT,
    "status" "SlipStatus" NOT NULL DEFAULT 'VALID',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "booking_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "receipt_url" TEXT NOT NULL,
    "transaction_ref" TEXT,
    "payment_method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewed_by_id" INTEGER,
    "rejection_note" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_logs" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "slip_verified" BOOLEAN NOT NULL DEFAULT false,
    "meat_given" BOOLEAN NOT NULL DEFAULT true,
    "portions_given" INTEGER NOT NULL,
    "payas_given" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "distributed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "animal_configs_kind_key" ON "animal_configs"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "animal_pools_year_id_animal_config_id_key" ON "animal_pools"("year_id", "animal_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "slaughter_schedules_year_id_animal_config_id_eid_day_key" ON "slaughter_schedules"("year_id", "animal_config_id", "eid_day");

-- CreateIndex
CREATE UNIQUE INDEX "booking_slips_booking_id_key" ON "booking_slips"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_slips_slip_code_key" ON "booking_slips"("slip_code");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_logs_booking_id_key" ON "distribution_logs"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "day_pricing_year_id_animal_config_id_eid_day_key" ON "day_pricing"("year_id", "animal_config_id", "eid_day");

-- AddForeignKey
ALTER TABLE "animal_pools" ADD CONSTRAINT "animal_pools_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_pools" ADD CONSTRAINT "animal_pools_animal_config_id_fkey" FOREIGN KEY ("animal_config_id") REFERENCES "animal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slaughter_schedules" ADD CONSTRAINT "slaughter_schedules_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slaughter_schedules" ADD CONSTRAINT "slaughter_schedules_animal_config_id_fkey" FOREIGN KEY ("animal_config_id") REFERENCES "animal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_pricing" ADD CONSTRAINT "day_pricing_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_pricing" ADD CONSTRAINT "day_pricing_animal_config_id_fkey" FOREIGN KEY ("animal_config_id") REFERENCES "animal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_animal_config_id_fkey" FOREIGN KEY ("animal_config_id") REFERENCES "animal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_animal_config_id_fkey" FOREIGN KEY ("animal_config_id") REFERENCES "animal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_slips" ADD CONSTRAINT "booking_slips_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_logs" ADD CONSTRAINT "distribution_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_logs" ADD CONSTRAINT "distribution_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
