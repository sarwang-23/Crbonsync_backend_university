import { Router } from "express";
import { upload, getAll, getById, getByActivity, remove, runOcr, createActivityFromOcr } from "./documents.controller";
import multer from "multer";

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ 
  storage, 
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: PDF, PNG, JPG, JPEG, CSV, XLSX"));
    }
  }
});

const documentsRouter = Router();

documentsRouter.post("/upload", uploadMiddleware.single("file"), upload);
documentsRouter.get("/", getAll);
documentsRouter.get("/:id", getById);
documentsRouter.get("/activity/:activityId", getByActivity);
documentsRouter.delete("/:id", remove);
documentsRouter.post("/:id/ocr", runOcr);
documentsRouter.post("/:id/create-activity", createActivityFromOcr);

export { documentsRouter };
