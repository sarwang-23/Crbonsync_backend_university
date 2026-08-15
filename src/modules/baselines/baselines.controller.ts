import { Request, Response } from "express";
import { 
  createBaseline, 
  getBaselines, 
  getBaselineById,
  changeBaselineStatus, 
  getBaselineComparison 
} from "./baselines.service";
import { createBaselineSchema } from "./baselines.validator";

export const createBaselineController = async (req: Request, res: Response) => {
  try {
    const data = createBaselineSchema.parse(req.body);
    const result = await createBaseline(data);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create baseline" });
  }
};

export const getBaselinesController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) throw new Error("universityId is required");
    const data = await getBaselines(universityId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to fetch baselines" });
  }
};

export const getBaselineByIdController = async (req: Request, res: Response) => {
  try {
    const data = await getBaselineById(req.params.id as string);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to fetch baseline" });
  }
};

export const submitBaselineController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || "system";
    const data = await changeBaselineStatus(req.params.id, "UNDER_REVIEW", userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to submit baseline" });
  }
};

export const approveBaselineController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || "system";
    const data = await changeBaselineStatus(req.params.id, "APPROVED", userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to approve baseline" });
  }
};

export const lockBaselineController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || "system";
    const data = await changeBaselineStatus(req.params.id, "LOCKED", userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to lock baseline" });
  }
};

export const getComparisonController = async (req: Request, res: Response) => {
  try {
    const data = await getBaselineComparison(req.params.id as string);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to fetch comparison" });
  }
};
