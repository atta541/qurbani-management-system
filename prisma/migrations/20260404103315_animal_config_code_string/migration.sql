-- AnimalConfig.kind: PostgreSQL enum -> TEXT (keeps existing values via ::text).
-- Safe when the column is still enum-typed; no-op cast if already text in edge cases.

ALTER TABLE "animal_configs" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "animal_configs" ALTER COLUMN "kind" TYPE TEXT USING ("kind"::text);

DROP TYPE IF EXISTS "AnimalKind";
