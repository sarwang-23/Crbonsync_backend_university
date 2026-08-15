-- Add CEA, INCCA, CLIMATIQ to EmissionFactorSource enum
ALTER TYPE "EmissionFactorSource" ADD VALUE 'CEA';
ALTER TYPE "EmissionFactorSource" ADD VALUE 'INCCA';
ALTER TYPE "EmissionFactorSource" ADD VALUE 'CLIMATIQ';

-- Add isFixed and year to EmissionFactor
ALTER TABLE "EmissionFactor" ADD COLUMN "isFixed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EmissionFactor" ADD COLUMN "year" INTEGER;

CREATE INDEX "EmissionFactor_isFixed_idx" ON "EmissionFactor"("isFixed");
CREATE INDEX "EmissionFactor_year_idx" ON "EmissionFactor"("year");

-- Add factor snapshot fields to Calculation
ALTER TABLE "Calculation" ADD COLUMN "factorSource" TEXT;
ALTER TABLE "Calculation" ADD COLUMN "factorVersion" TEXT;
ALTER TABLE "Calculation" ADD COLUMN "factorName" TEXT;

-- Create ClimatiqCache table
CREATE TABLE "ClimatiqCache" (
    "id" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "country" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "climatiqId" TEXT NOT NULL,
    "climatiqVersion" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClimatiqCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClimatiqCache_category_country_year_key" ON "ClimatiqCache"("category", "country", "year");
CREATE INDEX "ClimatiqCache_category_idx" ON "ClimatiqCache"("category");
CREATE INDEX "ClimatiqCache_country_idx" ON "ClimatiqCache"("country");
CREATE INDEX "ClimatiqCache_year_idx" ON "ClimatiqCache"("year");