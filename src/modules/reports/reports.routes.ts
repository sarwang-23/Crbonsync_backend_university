import { Router } from "express";
import { generate, generatePdf, list, getSingle, download } from "./reports.controller";

const reportsRouter = Router();

reportsRouter.post("/generate", generate);
reportsRouter.post("/:id/generate-pdf", generatePdf);
reportsRouter.get("/", list);
reportsRouter.get("/:id", getSingle);
reportsRouter.get("/:id/download", download);

export { reportsRouter };
