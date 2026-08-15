import { prisma } from "../../config/prisma";
import { CreateDocumentInput } from "./documents.types";

export const uploadDocument = async (
  fileData: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    storagePath?: string;
    publicUrl?: string;
  },
  metadata: CreateDocumentInput,
  userId?: string
) => {
  // Check activity data ownership if provided
  if (metadata.activityDataId) {
    const activity = await prisma.activityData.findUnique({
      where: { id: metadata.activityDataId },
      select: { universityId: true }
    });

    if (!activity) {
      throw new Error("Activity data not found");
    }

    if (activity.universityId !== metadata.universityId) {
      throw new Error("Activity data does not belong to this university");
    }
  }

  const document = await prisma.document.create({
    data: {
      universityId: metadata.universityId,
      activityDataId: metadata.activityDataId,
      documentType: metadata.documentType,
      fileName: fileData.fileName,
      originalName: fileData.originalName,
      fileUrl: fileData.fileUrl,
      storagePath: fileData.storagePath || null,
      publicUrl: fileData.publicUrl || null,
      mimeType: fileData.mimeType,
      fileSize: fileData.fileSize,
      description: metadata.description,
      uploadedById: userId,
      status: "UPLOADED"
    }
  });

  return document;
};

export const getDocuments = async (universityId: string) => {
  return prisma.document.findMany({
    where: { universityId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });
};

export const getDocumentById = async (id: string, universityId: string) => {
  const document = await prisma.document.findFirst({
    where: { id, universityId },
    include: {
      uploadedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};

export const getDocumentsByActivityId = async (activityDataId: string, universityId: string) => {
  return prisma.document.findMany({
    where: { activityDataId, universityId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });
};

export const deleteDocument = async (id: string, universityId: string) => {
  const document = await prisma.document.findFirst({
    where: { id, universityId }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Ideally, you would also remove the file from the filesystem/S3 here
  await prisma.document.delete({
    where: { id }
  });
};

export const runMockOcr = async (id: string, universityId: string) => {
  const document = await getDocumentById(id, universityId);
  
  // Placeholder OCR processing delay
  await new Promise(r => setTimeout(r, 2000));
  
  // Mock extracted data
  return {
    documentId: document.id,
    extractedData: {
      date: "2026-08-15",
      vendor: "Utility Corp",
      totalAmount: 12500,
      unit: "kWh",
      category: "PURCHASED_ELECTRICITY"
    },
    confidenceScore: 0.92
  };
};
