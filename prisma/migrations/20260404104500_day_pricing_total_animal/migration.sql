-- AlterTable
ALTER TABLE "day_pricing" ADD COLUMN "total_price_per_animal" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill from existing per-portion price × portions per animal
UPDATE "day_pricing" AS dp
SET "total_price_per_animal" = ROUND(
  (dp."price_per_portion" * ac."portions_per_animal")::numeric,
  2
)
FROM "animal_configs" AS ac
WHERE ac.id = dp."animal_config_id";
