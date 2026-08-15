-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'SUSTAINABILITY_MANAGER', 'FACILITIES_MANAGER', 'DATA_ENTRY', 'REVIEWER', 'AUDITOR', 'MANAGEMENT');

-- CreateEnum
CREATE TYPE "UniversityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ELECTRICITY_METER', 'SUB_METER', 'DIESEL_GENERATOR', 'LPG_EQUIPMENT', 'NATURAL_GAS_EQUIPMENT', 'BOILER', 'CHILLER', 'AIR_CONDITIONER', 'REFRIGERATION_SYSTEM', 'FIRE_SUPPRESSION_SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityScope" AS ENUM ('SCOPE_1', 'SCOPE_2');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('DIESEL', 'PETROL', 'LPG', 'NATURAL_GAS', 'CNG', 'GENERATOR_FUEL', 'BOILER_FUEL', 'REFRIGERANT', 'OWNED_VEHICLE', 'PURCHASED_ELECTRICITY', 'PURCHASED_STEAM', 'PURCHASED_HEATING', 'PURCHASED_COOLING');

-- CreateEnum
CREATE TYPE "EmissionFactorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "CalculationStatus" AS ENUM ('CALCULATED', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ReportingPeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'SUBMITTED', 'VERIFIED', 'LOCKED');

-- CreateEnum
CREATE TYPE "BaselineStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EmissionFactorSource" AS ENUM ('GOVERNMENT', 'DEFRA', 'EPA', 'IPCC', 'IEA', 'CEA', 'INCCA', 'GRID_FACTOR', 'CUSTOM', 'OTHER', 'CLIMATIQ');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'VERIFY', 'CALCULATE', 'LOGIN', 'LOGOUT', 'GENERATE', 'DOWNLOAD', 'EXPORT', 'VIEW', 'ACTIVITY_CREATED', 'ACTIVITY_UPDATED', 'ACTIVITY_VERIFIED', 'ACTIVITY_CALCULATED', 'EMISSION_FACTOR_SELECTED', 'CALCULATION_CREATED', 'REPORT_GENERATED', 'REPORT_DOWNLOADED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ELECTRICITY_BILL', 'FUEL_INVOICE', 'LPG_INVOICE', 'NATURAL_GAS_INVOICE', 'REFRIGERANT_RECORD', 'METER_READING', 'VEHICLE_RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "postalCode" TEXT,
    "status" "UniversityStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DATA_ENTRY',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "universityId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "postalCode" TEXT,
    "universityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "campusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "floorNumber" INTEGER,
    "areaSqm" DOUBLE PRECISION,
    "buildingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "capacity" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "description" TEXT,
    "floorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityData" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "campusId" TEXT,
    "buildingId" TEXT,
    "floorId" TEXT,
    "assetId" TEXT,
    "category" "ActivityCategory" NOT NULL,
    "scope" "ActivityScope" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3),
    "description" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "enteredById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "scope" "ActivityScope" NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "source" "EmissionFactorSource" NOT NULL,
    "sourceName" TEXT,
    "sourceVersion" TEXT,
    "sourceUrl" TEXT,
    "region" TEXT,
    "country" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "status" "EmissionFactorStatus" NOT NULL DEFAULT 'ACTIVE',
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "activityDataId" TEXT NOT NULL,
    "emissionFactorId" TEXT NOT NULL,
    "scope" "ActivityScope" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "activityUnit" TEXT NOT NULL,
    "emissionFactor" DOUBLE PRECISION NOT NULL,
    "factorUnit" TEXT NOT NULL,
    "factorSource" TEXT,
    "factorVersion" TEXT,
    "factorName" TEXT,
    "co2eKg" DOUBLE PRECISION NOT NULL,
    "status" "CalculationStatus" NOT NULL DEFAULT 'CALCULATED',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Baseline" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "baselineYear" INTEGER NOT NULL,
    "scope1KgCO2e" DOUBLE PRECISION NOT NULL,
    "scope2KgCO2e" DOUBLE PRECISION NOT NULL,
    "totalKgCO2e" DOUBLE PRECISION NOT NULL,
    "methodology" TEXT,
    "notes" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" "BaselineStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "reportingPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Baseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "universityId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "activityDataId" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReportingPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SustainabilityTarget" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "reductionPct" DOUBLE PRECISION NOT NULL,
    "targetCo2eKg" DOUBLE PRECISION,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SustainabilityTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityStatistics" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "studentCount" INTEGER,
    "staffCount" INTEGER,
    "totalAreaSqm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "buildingId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "estimatedReductionKg" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATING',
    "filePath" TEXT,
    "fileName" TEXT,
    "totalEmissionsKg" DOUBLE PRECISION,
    "scope1Kg" DOUBLE PRECISION,
    "scope2Kg" DOUBLE PRECISION,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_code_key" ON "University"("code");

-- CreateIndex
CREATE INDEX "University_name_idx" ON "University"("name");

-- CreateIndex
CREATE INDEX "University_status_idx" ON "University"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_universityId_idx" ON "User"("universityId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "Campus_universityId_idx" ON "Campus"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_universityId_code_key" ON "Campus"("universityId", "code");

-- CreateIndex
CREATE INDEX "Building_campusId_idx" ON "Building"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "Building_campusId_code_key" ON "Building"("campusId", "code");

-- CreateIndex
CREATE INDEX "Floor_buildingId_idx" ON "Floor"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_buildingId_code_key" ON "Floor"("buildingId", "code");

-- CreateIndex
CREATE INDEX "Asset_floorId_idx" ON "Asset"("floorId");

-- CreateIndex
CREATE INDEX "Asset_type_idx" ON "Asset"("type");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_floorId_code_key" ON "Asset"("floorId", "code");

-- CreateIndex
CREATE INDEX "ActivityData_universityId_idx" ON "ActivityData"("universityId");

-- CreateIndex
CREATE INDEX "ActivityData_reportingPeriodId_idx" ON "ActivityData"("reportingPeriodId");

-- CreateIndex
CREATE INDEX "ActivityData_campusId_idx" ON "ActivityData"("campusId");

-- CreateIndex
CREATE INDEX "ActivityData_buildingId_idx" ON "ActivityData"("buildingId");

-- CreateIndex
CREATE INDEX "ActivityData_floorId_idx" ON "ActivityData"("floorId");

-- CreateIndex
CREATE INDEX "ActivityData_category_idx" ON "ActivityData"("category");

-- CreateIndex
CREATE INDEX "ActivityData_scope_idx" ON "ActivityData"("scope");

-- CreateIndex
CREATE INDEX "ActivityData_status_idx" ON "ActivityData"("status");

-- CreateIndex
CREATE INDEX "ActivityData_activityDate_idx" ON "ActivityData"("activityDate");

-- CreateIndex
CREATE INDEX "EmissionFactor_category_idx" ON "EmissionFactor"("category");

-- CreateIndex
CREATE INDEX "EmissionFactor_scope_idx" ON "EmissionFactor"("scope");

-- CreateIndex
CREATE INDEX "EmissionFactor_country_idx" ON "EmissionFactor"("country");

-- CreateIndex
CREATE INDEX "EmissionFactor_region_idx" ON "EmissionFactor"("region");

-- CreateIndex
CREATE INDEX "EmissionFactor_status_idx" ON "EmissionFactor"("status");

-- CreateIndex
CREATE INDEX "EmissionFactor_isFixed_idx" ON "EmissionFactor"("isFixed");

-- CreateIndex
CREATE INDEX "EmissionFactor_year_idx" ON "EmissionFactor"("year");

-- CreateIndex
CREATE INDEX "Calculation_universityId_idx" ON "Calculation"("universityId");

-- CreateIndex
CREATE INDEX "Calculation_reportingPeriodId_idx" ON "Calculation"("reportingPeriodId");

-- CreateIndex
CREATE INDEX "Calculation_activityDataId_idx" ON "Calculation"("activityDataId");

-- CreateIndex
CREATE INDEX "Calculation_emissionFactorId_idx" ON "Calculation"("emissionFactorId");

-- CreateIndex
CREATE INDEX "Calculation_scope_idx" ON "Calculation"("scope");

-- CreateIndex
CREATE INDEX "Calculation_status_idx" ON "Calculation"("status");

-- CreateIndex
CREATE INDEX "ClimatiqCache_category_idx" ON "ClimatiqCache"("category");

-- CreateIndex
CREATE INDEX "ClimatiqCache_country_idx" ON "ClimatiqCache"("country");

-- CreateIndex
CREATE INDEX "ClimatiqCache_year_idx" ON "ClimatiqCache"("year");

-- CreateIndex
CREATE UNIQUE INDEX "ClimatiqCache_category_country_year_unit_key" ON "ClimatiqCache"("category", "country", "year", "unit");

-- CreateIndex
CREATE INDEX "Baseline_universityId_idx" ON "Baseline"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Baseline_universityId_baselineYear_key" ON "Baseline"("universityId", "baselineYear");

-- CreateIndex
CREATE INDEX "AuditLog_universityId_idx" ON "AuditLog"("universityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Document_universityId_idx" ON "Document"("universityId");

-- CreateIndex
CREATE INDEX "Document_activityDataId_idx" ON "Document"("activityDataId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "ReportingPeriod_universityId_idx" ON "ReportingPeriod"("universityId");

-- CreateIndex
CREATE INDEX "ReportingPeriod_isBaseline_idx" ON "ReportingPeriod"("isBaseline");

-- CreateIndex
CREATE INDEX "ReportingPeriod_status_idx" ON "ReportingPeriod"("status");

-- CreateIndex
CREATE INDEX "ReportingPeriod_startDate_idx" ON "ReportingPeriod"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_universityId_name_key" ON "ReportingPeriod"("universityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_universityId_startDate_endDate_key" ON "ReportingPeriod"("universityId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "SustainabilityTarget_universityId_idx" ON "SustainabilityTarget"("universityId");

-- CreateIndex
CREATE INDEX "SustainabilityTarget_targetYear_idx" ON "SustainabilityTarget"("targetYear");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityStatistics_universityId_reportingPeriodId_key" ON "UniversityStatistics"("universityId", "reportingPeriodId");

-- CreateIndex
CREATE INDEX "Recommendation_universityId_idx" ON "Recommendation"("universityId");

-- CreateIndex
CREATE INDEX "Recommendation_priority_idx" ON "Recommendation"("priority");

-- CreateIndex
CREATE INDEX "Recommendation_status_idx" ON "Recommendation"("status");

-- CreateIndex
CREATE INDEX "Report_universityId_idx" ON "Report"("universityId");

-- CreateIndex
CREATE INDEX "Report_reportingPeriodId_idx" ON "Report"("reportingPeriodId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_activityDataId_fkey" FOREIGN KEY ("activityDataId") REFERENCES "ActivityData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "EmissionFactor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baseline" ADD CONSTRAINT "Baseline_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baseline" ADD CONSTRAINT "Baseline_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_activityDataId_fkey" FOREIGN KEY ("activityDataId") REFERENCES "ActivityData"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SustainabilityTarget" ADD CONSTRAINT "SustainabilityTarget_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

