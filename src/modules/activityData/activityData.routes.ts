import { Router } from "express";
import {
  createActivityDataController,
  getActivityDataController,
  getActivityDataByIdController,
  updateActivityDataController,
  deleteActivityDataController,
  submitActivityDataController,
  startReviewActivityDataController,
  verifyActivityDataController,
  rejectActivityDataController,
  getReviewActivitiesController
} from "./activityData.controller";
import { validate } from "../../middleware/validate.middleware";
import { createActivityDataSchema } from "./activityData.validator";
import { downloadTemplate, previewImport, confirmImport } from "./activityData.import";
import multer from "multer";

const activityDataRouter = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: CSV, XLSX, XLS"));
    }
  }
});

activityDataRouter.post("/", validate(createActivityDataSchema), createActivityDataController);

// Import Routes
activityDataRouter.get("/import/template", downloadTemplate);
activityDataRouter.post("/import/preview", upload.single("file"), previewImport);
activityDataRouter.post("/import/confirm", confirmImport);
activityDataRouter.get("/review", getReviewActivitiesController);
activityDataRouter.get("/", getActivityDataController);
activityDataRouter.get("/:id", getActivityDataByIdController);
activityDataRouter.patch("/:id", updateActivityDataController);
activityDataRouter.delete("/:id", deleteActivityDataController);

activityDataRouter.post("/:id/submit", submitActivityDataController);
activityDataRouter.post("/:id/start-review", startReviewActivityDataController);
activityDataRouter.post("/:id/verify", verifyActivityDataController);
activityDataRouter.post("/:id/reject", rejectActivityDataController);

export { activityDataRouter };
