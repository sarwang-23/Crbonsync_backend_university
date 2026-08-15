import { Request, Response, NextFunction } from "express";
import { uploadDocument, getDocuments, getDocumentById, getDocumentsByActivityId, deleteDocument, runMockOcr } from "./documents.service";
import { uploadDocumentBodySchema } from "./documents.validator";
import { prisma } from "../../config/prisma";
import { supabase } from "../../config/supabase";
import { randomUUID } from "crypto";
import { checkIsolation } from "../../middleware/checkIsolation.middleware";
import { createAuditLog } from "../auditLogs/auditLogs.service";
import { AuditAction } from "../../generated/prisma/client";

export const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const validated = uploadDocumentBodySchema.parse(req.body);
    checkIsolation(req, validated.universityId);
    
    const userId = (req as any).user?.userId;
    const fileExt = req.file.originalname.split('.').pop();
    const uniqueFileName = `${randomUUID()}.${fileExt}`;
    const storagePath = `universities/${validated.universityId}/invoices/${uniqueFileName}`;

    const { data: uploadData, error } = await supabase.storage
      .from("carbonsynq-documents")
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("carbonsynq-documents")
      .getPublicUrl(storagePath);

    const document = await prisma.uploadedDocument.create({
      data: {
        universityId: validated.universityId,
        fileName: uniqueFileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: storagePath,
        publicUrl: publicUrlData.publicUrl,
        documentType: validated.documentType,
        uploadedBy: userId,
        status: "UPLOADED"
      }
    });

    await createAuditLog({
      action: AuditAction.DOCUMENT_UPLOADED,
      entityType: "Document",
      entityId: document.id,
      userId: userId,
      universityId: validated.universityId,
      metadata: { originalName: req.file.originalname, mimeType: req.file.mimetype },
      description: "Document uploaded"
    });

    return res.status(201).json({ 
      success: true, 
      data: {
        documentId: document.id,
        fileName: document.originalName,
        status: document.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }

    checkIsolation(req, universityId);

    const documents = await getDocuments(universityId);
    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }

    checkIsolation(req, universityId);

    const document = await getDocumentById(req.params.id as string, universityId);
    return res.status(200).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const getByActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }

    checkIsolation(req, universityId);

    const documents = await getDocumentsByActivityId(req.params.activityId as string, universityId);
    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }

    checkIsolation(req, universityId);

    const documentId = req.params.id as string;
    await deleteDocument(documentId, universityId);
    
    await createAuditLog({
      action: AuditAction.DOCUMENT_DELETED,
      entityType: "Document",
      entityId: documentId,
      userId: (req as any).user?.userId,
      universityId: universityId,
      description: "Document deleted"
    });

    return res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const runOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.body.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required in body" });
    }

    checkIsolation(req, universityId);
    
    const documentId = req.params.id as string;

    await createAuditLog({
      action: AuditAction.OCR_STARTED,
      entityType: "Document",
      entityId: documentId,
      userId: (req as any).user?.userId,
      universityId: universityId,
      description: "OCR processing started"
    });

    const result = await runMockOcr(documentId, universityId);

    await createAuditLog({
      action: AuditAction.OCR_COMPLETED,
      entityType: "Document",
      entityId: documentId,
      userId: (req as any).user?.userId,
      universityId: universityId,
      metadata: { result },
      description: "OCR processing completed"
    });

    return res.status(200).json({ success: true, data: result, message: "OCR processed successfully" });
  } catch (error) {
    next(error);
  }
};

export const createActivityFromOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.body.universityId as string;
    const reportingPeriodId = req.body.reportingPeriodId as string;
    const ocrData = req.body.ocrData; // The data returned by /ocr

    if (!universityId || !reportingPeriodId || !ocrData) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    checkIsolation(req, universityId);
    
    // Minimal mock implementation
    const activity = await prisma.activityData.create({
      data: {
        universityId,
        reportingPeriodId,
        category: ocrData.category || "OTHER",
        scope: "SCOPE_1", // mock
        quantity: ocrData.totalAmount || 1,
        unit: ocrData.unit || "unit",
        activityDate: ocrData.date ? new Date(ocrData.date) : new Date(),
        description: `Imported via OCR: ${ocrData.vendor}`,
        inputSource: "INVOICE",
        sourceFileId: typeof req.params.id === "string" ? req.params.id : null,
        status: "DRAFT"
      }
    });

    return res.status(201).json({ success: true, data: activity, message: "Activity created from OCR data" });
  } catch (error) {
    next(error);
  }
};
