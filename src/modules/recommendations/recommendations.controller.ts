import { Request, Response } from "express";
import { recommendationsService } from "./recommendations.service";
import { catchAsync } from "../../utils/catchAsync";
import { z } from "zod";

const querySchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
});

export const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  const query = querySchema.parse(req.query);
  const data = await recommendationsService.getRecommendations(query);
  res.status(200).json({ success: true, data });
});

export const generateRecommendations = catchAsync(async (req: Request, res: Response) => {
  const universityId = req.body.universityId;
  const reportingPeriodId = req.body.reportingPeriodId;
  
  if (!universityId || !reportingPeriodId) {
    return res.status(400).json({ success: false, message: "universityId and reportingPeriodId are required" });
  }

  const data = await recommendationsService.generateRecommendations(universityId, reportingPeriodId);
  res.status(201).json({ success: true, data });
});
