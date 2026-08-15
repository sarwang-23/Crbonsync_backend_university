import { Request, Response } from "express";
import { 
  createActivityData, 
  getActivityData, 
  getActivityDataById, 
  updateActivityData, 
  deleteActivityData,
  changeActivityStatus,
  verifyActivityData,
  rejectActivityData
} from "./activityData.service";
import { createActivityDataSchema, updateActivityDataSchema } from "./activityData.validator";
import { ActivityStatus, ActivityCategory, ActivityScope } from "../../generated/prisma/client";

const checkIsolation = (req: Request, targetUniversityId: string) => {
  const jwtUniversityId = (req as any).user?.universityId;
  if (jwtUniversityId && jwtUniversityId !== targetUniversityId) {
    throw new Error("Access denied: University isolation mismatch");
  }
};

export const createActivityDataController = async (req: Request, res: Response) => {
  try {
    const data = createActivityDataSchema.parse(req.body);
    checkIsolation(req, data.universityId);
    
    const userId = (req as any).user?.userId || null;
    const result = await createActivityData(userId, data);
    
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to create activity data", details: error.errors });
  }
};

export const getActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }
    checkIsolation(req, universityId);

    const params = {
      universityId,
      reportingPeriodId: req.query.reportingPeriodId as string,
      campusId: req.query.campusId as string,
      buildingId: req.query.buildingId as string,
      floorId: req.query.floorId as string,
      scope: req.query.scope as ActivityScope,
      category: req.query.category as ActivityCategory,
      status: req.query.status as ActivityStatus,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await getActivityData(params);
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to fetch activity data" });
  }
};

export const getActivityDataByIdController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
       return res.status(400).json({ success: false, message: "universityId is required" });
    }
    checkIsolation(req, universityId);

    const result = await getActivityDataById(req.params.id as string, universityId);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to fetch activity data" });
  }
};

export const updateActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }
    checkIsolation(req, universityId);

    const data = updateActivityDataSchema.parse(req.body);
    const result = await updateActivityData(req.params.id as string, universityId, data);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to update activity data", details: error.errors });
  }
};

export const deleteActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }
    checkIsolation(req, universityId);

    await deleteActivityData(req.params.id as string, universityId);
    return res.status(200).json({ success: true, message: "Activity data deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to delete activity data" });
  }
};

export const submitActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.body.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required in body" });
    }
    checkIsolation(req, universityId);
    const userId = (req as any).user?.userId || null;
    
    const result = await changeActivityStatus(req.params.id as string, universityId, "SUBMITTED", userId);
    return res.status(200).json({ success: true, data: result, message: "Activity data submitted successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to submit activity data" });
  }
};

export const startReviewActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.body.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required in body" });
    }
    checkIsolation(req, universityId);
    const userId = (req as any).user?.userId || null;
    
    const result = await changeActivityStatus(req.params.id as string, universityId, "UNDER_REVIEW", userId);
    return res.status(200).json({ success: true, data: result, message: "Activity review started" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to start review" });
  }
};

export const getReviewActivitiesController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }
    checkIsolation(req, universityId);

    const result = await getActivityData({
      universityId,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    });

    // Filter for review statuses
    const reviewData = result.data.filter(a => a.status === "DRAFT" || a.status === "UNDER_REVIEW");

    return res.status(200).json({ success: true, data: reviewData });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to fetch review activities" });
  }
};

export const verifyActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.body.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required in body" });
    }
    checkIsolation(req, universityId);
    const userId = (req as any).user?.userId || null;
    
    const result = await verifyActivityData(req.params.id as string, universityId, userId);
    return res.status(200).json({ success: true, data: result, message: "Activity verified successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to verify activity" });
  }
};

export const rejectActivityDataController = async (req: Request, res: Response) => {
  try {
    const universityId = req.body.universityId as string;
    const reason = req.body.reason as string;
    
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required in body" });
    }
    checkIsolation(req, universityId);
    const userId = (req as any).user?.userId || null;
    
    const result = await rejectActivityData(req.params.id as string, universityId, userId, reason);
    return res.status(200).json({ success: true, data: result, message: "Activity rejected successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to reject activity" });
  }
};
