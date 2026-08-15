/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and User Management
 *   - name: Dashboard
 *     description: Overview and Analytics Dashboard
 *   - name: ActivityData
 *     description: Emission Activity Data Management
 *   - name: Baselines
 *     description: Target and Baseline Tracking
 */
import { Router } from "express";

import { authRouter } from "../../modules/auth/auth.routes";
import { universitiesRouter } from "../../modules/universities/universities.routes";
import { campusesRouter } from "../../modules/campuses/campuses.routes";
import { buildingsRouter } from "../../modules/buildings/buildings.routes";
import { floorsRouter } from "../../modules/floors/floors.routes";
import { assetsRouter } from "../../modules/assets/assets.routes";
import { activityDataRouter } from "../../modules/activityData/activityData.routes";
import { emissionFactorsRouter } from "../../modules/emissionFactors/emissionFactors.routes";
import { calculationsRouter } from "../../modules/calculations/calculations.routes";
import { baselinesRouter } from "../../modules/baselines/baselines.routes";
import { dashboardRouter } from "../../modules/dashboard/dashboard.routes";
import { dataQualityRouter } from "../../modules/dataQuality/dataQuality.routes";
import { auditLogsRouter } from "../../modules/auditLogs/auditLogs.routes";
import { documentsRouter } from "../../modules/documents/documents.routes";
import { notificationsRouter } from "../../modules/notifications/notifications.routes";
import { reportingPeriodsRouter } from "../../modules/reportingPeriods/reportingPeriods.routes";
import { targetsRouter } from "../../modules/targets/targets.routes";
import { recommendationsRouter } from "../../modules/recommendations/recommendations.routes";
import { universityStatisticsRouter } from "../../modules/universityStatistics/universityStatistics.routes";
import { reportsRouter } from "../../modules/reports/reports.routes";

import { authenticate } from "../../middleware/auth.middleware";

const v1Router = Router();

v1Router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CarbonSynq UMS Backend",
    database: "connected"
  });
});

v1Router.use("/auth", authRouter);

// Apply JWT authentication to all subsequent routes
v1Router.use(authenticate);

v1Router.use("/universities", universitiesRouter);
v1Router.use("/campuses", campusesRouter);
v1Router.use("/buildings", buildingsRouter);
v1Router.use("/floors", floorsRouter);
v1Router.use("/assets", assetsRouter);
v1Router.use("/activity-data", activityDataRouter);
v1Router.use("/emission-factors", emissionFactorsRouter);
v1Router.use("/calculations", calculationsRouter);
v1Router.use("/baselines", baselinesRouter);
v1Router.use("/dashboard", dashboardRouter);
v1Router.use("/data-quality", dataQualityRouter);
v1Router.use("/audit-logs", auditLogsRouter);
v1Router.use("/documents", documentsRouter);
v1Router.use("/notifications", notificationsRouter);
v1Router.use("/reporting-periods", reportingPeriodsRouter);
v1Router.use("/targets", targetsRouter);
v1Router.use("/recommendations", recommendationsRouter);
v1Router.use("/university-statistics", universityStatisticsRouter);
v1Router.use("/reports", reportsRouter);

export { v1Router };
