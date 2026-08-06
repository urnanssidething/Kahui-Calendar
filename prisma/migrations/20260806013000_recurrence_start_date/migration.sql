-- AlterTable
ALTER TABLE "recurrences" ADD COLUMN     "start_date" TIMESTAMP(3);

-- Backfill existing rows with a sensible anchor (most recent occurrence of their weekday)
UPDATE "recurrences" SET "start_date" = '2026-08-03T12:00:00.000Z' WHERE "start_date" IS NULL;

-- AlterTable
ALTER TABLE "recurrences" ALTER COLUMN "start_date" SET NOT NULL;
