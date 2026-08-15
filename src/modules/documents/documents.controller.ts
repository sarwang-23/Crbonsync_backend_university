import { Request, Response, NextFunction } from "express";
import { uploadDocument, getDocuments, getDocumentById, getDocumentsByActivityId, deleteDocument } from "./documents.service";
import { uploadDocumentBodySchema } from "./documents.validator";

const checkIsolation = (req: Request, universityId: string) => {
  const user = (req as any).user;
  if (user && user.role !== "SUPER_ADMIN" && user.universityId !== universityId) {
    throw new Error("Unauthorized: Access restricted to your own university");
  }
};

export const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const validated = uploadDocumentBodySchema.parse(req.body);
    checkIsolation(req, validated.universityId);
    
    const userId = (req as any).user?.userId;

    const fileData = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    };

    const document = await uploadDocument(fileData, validated, userId);
    return res.status(201).json({ success: true, data: document });
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

    await deleteDocument(req.params.id as string, universityId);
    return res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};
