import { Router } from "express";
import {
  overview,
  scopeBreakdown,
  categoryBreakdown,
  topSources,
  buildingEmissions,
  floorEmissions,
  trends,
  baselineComparison,
  intensity,
  getSummary
} from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/overview", overview);
dashboardRouter.get("/scope-breakdown", scopeBreakdown);
dashboardRouter.get("/categories", categoryBreakdown);
dashboardRouter.get("/top-sources", topSources);
dashboardRouter.get("/trends", trends);
dashboardRouter.get("/buildings", buildingEmissions);
dashboardRouter.get("/floors", floorEmissions);
dashboardRouter.get("/baseline-comparison", baselineComparison);
dashboardRouter.get("/intensity", intensity);

export { dashboardRouter };
