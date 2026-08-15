import { Request, Response } from "express";

import {
  createCampus,
  getCampuses,
  getCampusById,
  updateCampus,
} from "./campuses.service";
import { createCampusSchema, updateCampusSchema } from "./campuses.validator";

export const createCampusController = async (req: Request, res: Response) => {
  try {
    const validatedData = createCampusSchema.parse(req.body);
    const campus = await createCampus(validatedData);
    return res.status(201).json({ success: true, data: campus });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getCampusesController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const universityId =
      typeof req.query.universityId === "string"
        ? req.query.universityId
        : undefined;

    const result = await getCampuses({
      page,
      limit,
      search,
      universityId,
    });

    return res.status(200).json({
      success: true,
      data: result.campuses,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campuses",
    });
  }
};

export const getCampusByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const campus = await getCampusById(id);
    return res.status(200).json({ success: true, data: campus });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Campus not found";
    return res.status(404).json({ success: false, message });
  }
};

export const updateCampusController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateCampusSchema.parse(req.body);
    const campus = await updateCampus(id, validatedData);
    return res.status(200).json({ success: true, message: "Campus updated successfully", data: campus });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to update campus";
    return res.status(400).json({ success: false, message });
  }
};
