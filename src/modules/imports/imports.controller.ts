import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../../services/storage.service";
import { processImportBuffer } from "./imports.service";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../auditLogs/auditLogs.service";
import { AuditAction } from "../../generated/prisma/client";

const checkIsolation = (req: Request, targetUniversityId: string) => {
  const jwtUniversityId = (req as any).user?.universityId;
  if (jwtUniversityId && jwtUniversityId !== targetUniversityId) {
    throw new Error("Access denied: University isolation mismatch");
  }
};

export const testStorageUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testContent = Buffer.from("CarbonSynq Storage Test OK");
    const result = await uploadFile("imports", `test/test-file-${Date.now()}.txt`, testContent, "text/plain");
    res.status(200).json({ success: true, message: "Storage test successful", data: result });
  } catch (error: any) {
    next(error);
  }
};

export const handleUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    // Default to a specific university/period if not in body for this MVP demo
    const universityId = req.body.universityId;
    const reportingPeriodId = req.body.reportingPeriodId;

    if (!universityId || !reportingPeriodId) {
       res.status(400).json({ success: false, message: "universityId and reportingPeriodId are required" });
       return;
    }
    
    checkIsolation(req, universityId);

    const { originalname, buffer, mimetype, size } = req.file;
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const filePath = `${universityId}/${year}/${timestamp}-${originalname}`;

    const uploadResult = await uploadFile("imports", filePath, buffer, mimetype);
    
    // Create Document
    const document = await prisma.document.create({
      data: {
        universityId,
        documentType: "OTHER",
        fileName: `${timestamp}-${originalname}`,
        originalName: originalname,
        fileUrl: uploadResult.path,
        storagePath: uploadResult.path,
        mimeType: mimetype,
        fileSize: size,
      }
    });

    // Parse Excel/CSV
    const parsedData = await processImportBuffer(
      buffer,
      universityId,
      reportingPeriodId,
      document.id,
      originalname,
      uploadResult.path
    );

    await createAuditLog({
      action: "IMPORT" as AuditAction,
      entityType: "Document",
      entityId: document.id,
      universityId,
      metadata: { fileName: originalname, fileSize: size, validRows: parsedData.validCount },
      description: "Excel/CSV import file uploaded and parsed for preview",
    });

    res.status(200).json({
      success: true,
      message: "File uploaded, parsed and validated",
      data: {
        documentId: document.id,
        ...parsedData
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const confirmImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const documentId = req.params.id as string;
    const { validRows, universityId, reportingPeriodId } = req.body;

    if (!documentId || !validRows || !universityId || !reportingPeriodId) {
       res.status(400).json({ success: false, message: "documentId (in path), validRows, universityId, reportingPeriodId are required" });
       return;
    }

    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    
    checkIsolation(req, universityId);
    
    // Also ensure the document belongs to the claimed university
    if (document.universityId !== universityId) {
      res.status(403).json({ success: false, message: "Access denied: Document does not belong to the specified university" });
      return;
    }

    const buildings = await prisma.building.findMany({ where: { campus: { universityId } } });
    const floors = await prisma.floor.findMany({ where: { code: { not: '' } } }); 

    const determineScope = (category: string) => {
      const scope2Categories = ["PURCHASED_ELECTRICITY", "PURCHASED_STEAM", "PURCHASED_HEATING", "PURCHASED_COOLING"];
      return scope2Categories.includes(category) ? "SCOPE_2" : "SCOPE_1";
    };

    const activityDataToInsert = validRows.map((row: any) => {
      const scope = determineScope(row["Activity Category"] as any);
      const matchedBuilding = buildings.find(b => b.name.toLowerCase() === row.Building?.toLowerCase());
      const matchedFloor = floors.find(f => f.name.toLowerCase() === row.Floor?.toLowerCase());

      return {
        universityId,
        reportingPeriodId,
        category: row["Activity Category"] as any,
        scope,
        quantity: row.Quantity,
        unit: row.Unit,
        activityDate: row["Activity Date"],
        description: row.Description,
        status: "DRAFT" as const,
        inputSource: "EXCEL" as const,
        sourceFileId: document.id,
        sourceFileName: document.originalName,
        sourceDocumentUrl: document.publicUrl || document.fileUrl,
        buildingId: matchedBuilding?.id,
        floorId: matchedFloor?.id,
      };
    });

    const result = await prisma.activityData.createMany({
      data: activityDataToInsert,
    });

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "PROCESSED" }
    });

    await createAuditLog({
      action: "IMPORT_COMPLETED" as AuditAction,
      entityType: "Document",
      entityId: document.id,
      universityId,
      metadata: { insertedCount: result.count },
      description: "Import preview confirmed, DRAFT activity data created",
    });

    res.status(200).json({
      success: true,
      message: "Import confirmed and activity data created as DRAFT",
      data: { insertedCount: result.count }
    });
  } catch (error: any) {
    next(error);
  }
};
