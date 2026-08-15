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
    
    const metrics = await getDataQualityMetrics(universityId);
    return res.status(200).json(metrics);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to fetch metrics" });
  }
};
