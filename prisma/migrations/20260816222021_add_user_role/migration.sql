-- CreateEnum
CREATE TYPE "ActivityInputSource" AS ENUM ('MANUAL', 'CSV', 'EXCEL', 'INVOICE', 'PDF', 'API');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PREVIEW', 'COMPLETED', 'PARTIAL', 'FAILED');

-- AlterEnum
ALTER TYPE "ActivityStatus" ADD VALUE 'CALCULATED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ACTIVITY_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE 'OCR_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'OCR_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'OCR_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'EF_RESOLVED_FIXED';
ALTER TYPE "AuditAction" ADD VALUE 'EF_RESOLVED_CLIMATIQ';
ALTER TYPE "AuditAction" ADD VALUE 'EF_CREATED_MANUAL';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "ActivityData" ADD COLUMN     "inputSource" "ActivityInputSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceDocumentUrl" TEXT,
ADD COLUMN     "sourceFileId" TEXT,
ADD COLUMN     "sourceFileName" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "publicUrl" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN     "storagePath" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedDocument" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "documentType" TEXT,
    "uploadedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_universityId_idx" ON "ImportJob"("universityId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
