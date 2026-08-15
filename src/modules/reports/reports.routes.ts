import { Router } from "express";
import { generate, generatePdf, list, getSingle, downloadReport } from "./reports.controller";
import { validateRequest } from "../../middleware/validate.middleware";
import { generateReportSchema, getReportsSchema, reportIdParamSchema } from "./reports.validator";

const reportsRouter = Router();

reportsRouter.post("/generate", validateRequest(generateReportSchema, "body"), generate);
reportsRouter.post("/:id/generate-pdf", validateRequest(reportIdParamSchema, "params"), generatePdf);
reportsRouter.get("/", validateRequest(getReportsSchema, "query"), list);
reportsRouter.get("/:id", validateRequest(reportIdParamSchema, "params"), getSingle);
reportsRouter.get("/:id/download", validateRequest(reportIdParamSchema, "params"), downloadReport);

export { reportsRouter };
