import { Request, Response } from "express";
import { getDataQualityMetrics } from "./dataQuality.service";

const checkIsolation = (req: Request, targetUniversityId: string) => {
  const jwtUniversityId = (req as any).user?.universityId;
  if (jwtUniversityId && jwtUniversityId !== targetUniversityId) {
    throw new Error("Access denied: University isolation mismatch");
  }
};

export const getMetricsController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }

    checkIsolation(req, universityId);

    const filters: any = {};
    if (req.query.reportingPeriodId) filters.reportingPeriodId = req.query.reportingPeriodId as string;
    if (req.query.scope) filters.scope = req.query.scope as string;
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.campusId) filters.campusId = req.query.campusId as string;
    if (req.query.buildingId) filters.buildingId = req.query.buildingId as string;

    const metrics = await getDataQualityMetrics(universityId, filters);
    return res.status(200).json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to fetch metrics" });
  }
};
