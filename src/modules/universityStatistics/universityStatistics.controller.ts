import { Request, Response } from "express";
import { getUniversityStatistics, createUniversityStatistic, updateUniversityStatistic, deleteUniversityStatistic } from "./universityStatistics.service";

export const getStatisticsController = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) throw new Error("universityId is required");
    const data = await getUniversityStatistics(universityId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to fetch statistics" });
  }
};

export const createStatisticController = async (req: Request, res: Response) => {
  try {
    const data = await createUniversityStatistic(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to create statistic" });
  }
};

export const updateStatisticController = async (req: Request, res: Response) => {
  try {
    const data = await updateUniversityStatistic(String(req.params.id), req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to update statistic" });
  }
};

export const deleteStatisticController = async (req: Request, res: Response) => {
  try {
    await deleteUniversityStatistic(String(req.params.id));
    return res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Failed to delete statistic" });
  }
};
