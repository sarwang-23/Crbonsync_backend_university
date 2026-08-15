import { Request, Response } from "express";
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
} from "./assets.service";
import { createAssetSchema, updateAssetSchema } from "./assets.validator";

export const createAssetController = async (req: Request, res: Response) => {
  try {
    const validatedData = createAssetSchema.parse(req.body);
    const asset = await createAsset(validatedData);
    return res.status(201).json({ success: true, message: "Asset created successfully", data: asset });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to create asset";
    return res.status(400).json({ success: false, message });
  }
};

export const getAssetsController = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const floorId = typeof req.query.floorId === "string" ? req.query.floorId : undefined;
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const result = await getAssets({ page, limit, search, floorId, type, status });

    return res.status(200).json({
      success: true,
      data: result.assets,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch assets" });
  }
};

export const getAssetByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const asset = await getAssetById(id);
    return res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Asset not found";
    return res.status(404).json({ success: false, message });
  }
};

export const updateAssetController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateAssetSchema.parse(req.body);
    const asset = await updateAsset(id, validatedData);
    return res.status(200).json({ success: true, message: "Asset updated successfully", data: asset });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to update asset";
    return res.status(400).json({ success: false, message });
  }
};
