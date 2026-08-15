import { Router } from "express";
import { 
  createBaselineController, 
  getBaselinesController,
  getBaselineByIdController,
  submitBaselineController,
  approveBaselineController,
  lockBaselineController,
  getComparisonController
} from "./baselines.controller";

const baselinesRouter = Router();

baselinesRouter.post("/", createBaselineController);
baselinesRouter.get("/", getBaselinesController);
baselinesRouter.get("/:id", getBaselineByIdController);

baselinesRouter.post("/:id/submit", submitBaselineController);
baselinesRouter.post("/:id/approve", approveBaselineController);
baselinesRouter.post("/:id/lock", lockBaselineController);

baselinesRouter.get("/:id/comparison", getComparisonController);

export { baselinesRouter };
