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
  rejectActivityDataController
} from "./activityData.controller";
import { validate } from "../../middleware/validate.middleware";
import { createActivityDataSchema } from "./activityData.validator";

const activityDataRouter = Router();

activityDataRouter.post("/", validate(createActivityDataSchema), createActivityDataController);
activityDataRouter.get("/", getActivityDataController);
activityDataRouter.get("/:id", getActivityDataByIdController);
activityDataRouter.patch("/:id", updateActivityDataController);
activityDataRouter.delete("/:id", deleteActivityDataController);

activityDataRouter.post("/:id/submit", submitActivityDataController);
activityDataRouter.post("/:id/start-review", startReviewActivityDataController);
activityDataRouter.post("/:id/verify", verifyActivityDataController);
activityDataRouter.post("/:id/reject", rejectActivityDataController);

export { activityDataRouter };
