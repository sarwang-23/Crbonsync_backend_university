import { Request, Response } from "express";
import { targetsService } from "./targets.service";
import { createTargetSchema } from "./targets.validator";
import { catchAsync } from "../../utils/catchAsync";

export const createTarget = catchAsync(async (req: Request, res: Response) => {
  const data = createTargetSchema.parse(req.body);
  const result = await targetsService.createTarget(data);
  res.status(201).json({ success: true, data: result });
});

export const getTargetProgress = catchAsync(async (req: Request, res: Response) => {
  const targetId = String(req.params.id);
  // Fallback to recent if reportingPeriodId is not passed for simplicity
  const reportingPeriodId = String(req.query.reportingPeriodId);
  const result = await targetsService.getTargetProgress({ targetId, reportingPeriodId });
  res.status(200).json({ success: true, data: result });
});

export const getTargets = catchAsync(async (req: Request, res: Response) => {
  const universityId = String(req.query.universityId);
  const result = await targetsService.getTargets(universityId);
  res.status(200).json({ success: true, data: result });
});
