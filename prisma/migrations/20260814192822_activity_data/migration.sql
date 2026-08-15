-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ELECTRICITY_METER', 'GENERATOR', 'HVAC', 'AIR_CONDITIONER', 'REFRIGERATION', 'BOILER', 'VEHICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ELECTRICITY_CONSUMPTION', 'DIESEL_CONSUMPTION', 'PETROL_CONSUMPTION', 'NATURAL_GAS_CONSUMPTION', 'LPG_CONSUMPTION', 'CNG_CONSUMPTION', 'REFRIGERANT_LEAKAGE', 'PURCHASED_HEAT', 'PURCHASED_STEAM', 'PURCHASED_COOLING', 'OTHER');

-- CreateEnum
CREATE TYPE "EmissionScope" AS ENUM ('SCOPE_1', 'SCOPE_2');

-- CreateEnum
CREATE TYPE "DataStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "capacity" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "installationDate" TIMESTAMP(3),
    "decommissionDate" TIMESTAMP(3),
    "floorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityData" (
    "id" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "scope" "EmissionScope" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "reportingStart" TIMESTAMP(3) NOT NULL,
    "reportingEnd" TIMESTAMP(3) NOT NULL,
    "dataStatus" "DataStatus" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT,
    "invoiceNumber" TEXT,
    "meterReading" DOUBLE PRECISION,
    "previousReading" DOUBLE PRECISION,
    "notes" TEXT,
    "assetId" TEXT,
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "Asset"("type");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_floorId_idx" ON "Asset"("floorId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_code_key" ON "Asset"("code");

-- CreateIndex
CREATE INDEX "ActivityData_activityType_idx" ON "ActivityData"("activityType");

-- CreateIndex
CREATE INDEX "ActivityData_scope_idx" ON "ActivityData"("scope");

-- CreateIndex
CREATE INDEX "ActivityData_reportingStart_reportingEnd_idx" ON "ActivityData"("reportingStart", "reportingEnd");

-- CreateIndex
CREATE INDEX "ActivityData_dataStatus_idx" ON "ActivityData"("dataStatus");

-- CreateIndex
CREATE INDEX "ActivityData_assetId_idx" ON "ActivityData"("assetId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
