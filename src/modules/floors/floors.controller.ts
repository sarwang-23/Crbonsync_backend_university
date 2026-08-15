import { Request, Response } from "express";
import {
  createFloor,
  getFloors,
  getFloorById,
  updateFloor,
} from "./floors.service";
import { createFloorSchema, updateFloorSchema } from "./floors.validator";

export const createFloorController = async (req: Request, res: Response) => {
  try {
    const validatedData = createFloorSchema.parse(req.body);
    const floor = await createFloor(validatedData);
    return res.status(201).json({ success: true, message: "Floor created successfully", data: floor });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to create floor";
    return res.status(400).json({ success: false, message });
  }
};

export const getFloorsController = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const buildingId = typeof req.query.buildingId === "string" ? req.query.buildingId : undefined;

    const result = await getFloors({ page, limit, search, buildingId });

    return res.status(200).json({
      success: true,
      data: result.floors,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch floors" });
  }
};

export const getFloorByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const floor = await getFloorById(id);
    return res.status(200).json({ success: true, data: floor });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Floor not found";
    return res.status(404).json({ success: false, message });
  }
};

export const updateFloorController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateFloorSchema.parse(req.body);
    const floor = await updateFloor(id, validatedData);
    return res.status(200).json({ success: true, message: "Floor updated successfully", data: floor });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to update floor";
    return res.status(400).json({ success: false, message });
  }
};
