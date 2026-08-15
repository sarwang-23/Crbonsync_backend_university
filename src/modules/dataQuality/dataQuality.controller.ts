import { Request, Response, NextFunction } from "express";
import { getDataQualityOverview, getMissingData } from "./dataQuality.service";

export const overview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = String(req.query.universityId);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "universityId is required",
      });
    }

    const reportingPeriodId = req.query.reportingPeriodId
      ? String(req.query.reportingPeriodId)
      : undefined;

    const data = await getDataQualityOverview(universityId, reportingPeriodId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const missingData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = String(req.query.universityId);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "universityId is required",
      });
    }

    const reportingPeriodId = req.query.reportingPeriodId
      ? String(req.query.reportingPeriodId)
      : undefined;

    const data = await getMissingData(universityId, reportingPeriodId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
