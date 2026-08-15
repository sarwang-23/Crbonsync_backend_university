import { Router } from "express";
import { overview, missingData } from "./dataQuality.controller";

const dataQualityRouter = Router();

dataQualityRouter.get("/overview", overview);
dataQualityRouter.get("/missing-data", missingData);

export { dataQualityRouter };
