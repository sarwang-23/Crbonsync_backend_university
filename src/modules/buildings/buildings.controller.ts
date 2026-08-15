import { Request, Response } from "express";
import {
  createBuilding,
  getBuildings,
  getBuildingById,
  updateBuilding,
} from "./buildings.service";
import { createBuildingSchema, updateBuildingSchema } from "./buildings.validator";

export const createBuildingController = async (req: Request, res: Response) => {
  try {
    const validatedData = createBuildingSchema.parse(req.body);
    const building = await createBuilding(validatedData);
    return res.status(201).json({ success: true, data: building });
  } catch (error: any) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to create building";
    return res.status(400).json({ success: false, message });
  }
};

export const getBuildingsController = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const campusId = typeof req.query.campusId === "string" ? req.query.campusId : undefined;

    const result = await getBuildings({ page, limit, search, campusId });

    return res.status(200).json({
      success: true,
      data: result.buildings,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch buildings" });
  }
};

export const getBuildingByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const building = await getBuildingById(id);
    return res.status(200).json({ success: true, data: building });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Building not found";
    return res.status(404).json({ success: false, message });
  }
};

export const updateBuildingController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateBuildingSchema.parse(req.body);
    const building = await updateBuilding(id, validatedData);
    return res.status(200).json({ success: true, message: "Building updated successfully", data: building });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to update building";
    return res.status(400).json({ success: false, message });
  }
};
