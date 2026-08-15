import { DocumentType } from "../../generated/prisma/client";

export interface CreateDocumentInput {
  universityId: string;
  activityDataId?: string;
  documentType: DocumentType;
  description?: string;
}

export interface DocumentResponse {
  id: string;
  universityId: string;
  activityDataId: string | null;
  documentType: DocumentType;
  fileName: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  description: string | null;
  uploadedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
