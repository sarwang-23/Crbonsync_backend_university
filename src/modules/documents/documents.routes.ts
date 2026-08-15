import { Router } from "express";
import { upload, getAll, getById, getByActivity, remove } from "./documents.controller";
import { uploadMiddleware } from "../../middleware/upload.middleware";

const documentsRouter = Router();

documentsRouter.post("/upload", uploadMiddleware.single("file"), upload);
documentsRouter.get("/", getAll);
documentsRouter.get("/:id", getById);
documentsRouter.get("/activity/:activityId", getByActivity);
documentsRouter.delete("/:id", remove);

export { documentsRouter };
