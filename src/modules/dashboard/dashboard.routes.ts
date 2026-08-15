/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview metrics
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Overview metrics successfully retrieved
 * 
 * /dashboard/scopes:
 *   get:
 *     summary: Get scope breakdown
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scope breakdown retrieved
 * 
 * /dashboard/categories:
 *   get:
 *     summary: Get category breakdown
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category breakdown retrieved
 */
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
