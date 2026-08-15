import { Router } from "express";
import { getMetricsController } from "./dataQuality.controller";

const dataQualityRouter = Router();

dataQualityRouter.get("/metrics", getMetricsController);

export { dataQualityRouter };
