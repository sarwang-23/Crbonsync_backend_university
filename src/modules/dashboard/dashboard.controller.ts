import { Request, Response, NextFunction } from "express";
import {
  getOverview,
  getScopeBreakdown,
  getCategoryBreakdown,
  getTopSources,
  getBuildingEmissions,
  getFloorEmissions,
  getMonthlyTrends,
  getBaselineComparison,
  getIntensityMetrics,
  getRecentActivity,
  getActivityStats,
  getTargets,
  getGroupBreakdown,
  getDefaultReportingPeriod
} from "./dashboard.service";

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    let reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : "";
    if (!reportingPeriodId) {
      const defaultPeriod = await getDefaultReportingPeriod(universityId);
      if (defaultPeriod) reportingPeriodId = defaultPeriod;
      else return res.status(400).json({ success: false, message: "No active reporting period found for this university" });
    }
    
    const [
      overview,
      scopeBreakdown,
      categories,
      topSources,
      buildings,
      floors,
      trends,
      baseline,
      intensity,
      recentActivity,
      activityStats,
      targets,
      groups
    ] = await Promise.all([
      getOverview(universityId, reportingPeriodId),
      getScopeBreakdown(universityId, reportingPeriodId),
      getCategoryBreakdown(universityId, reportingPeriodId),
      getTopSources(universityId, reportingPeriodId),
      getBuildingEmissions(universityId, reportingPeriodId),
      getFloorEmissions(universityId, reportingPeriodId),
      getMonthlyTrends(universityId, reportingPeriodId),
      getBaselineComparison(universityId, reportingPeriodId),
      getIntensityMetrics(universityId, reportingPeriodId),
      getRecentActivity(universityId, reportingPeriodId),
      getActivityStats(universityId, reportingPeriodId),
      getTargets(universityId),
      getGroupBreakdown(universityId, reportingPeriodId)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview,
        scopeBreakdown,
        categories,
        topSources,
        buildings,
        floors,
        trends,
        baseline,
        intensity,
        recentActivity,
        activityStats,
        targets,
        groups
        // Data quality could be pulled from dataQuality service if needed,
        // but skipping here to avoid circular deps or complex imports.
      }
    });
  } catch (error) { next(error); }
};

export const overview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getOverview(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const scopeBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getScopeBreakdown(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const categoryBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getCategoryBreakdown(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const topSources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getTopSources(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const buildingEmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getBuildingEmissions(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const floorEmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getFloorEmissions(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const trends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getMonthlyTrends(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const baselineComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    const currentPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : "";
    if (!universityId || !currentPeriodId) return res.status(400).json({ success: false, message: "universityId and reportingPeriodId are required" });
    
    const data = await getBaselineComparison(universityId, currentPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const intensity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
    if (!universityId) return res.status(400).json({ success: false, message: "universityId is required" });
    
    const reportingPeriodId = req.query.reportingPeriodId ? String(req.query.reportingPeriodId) : undefined;
    const data = await getIntensityMetrics(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};
