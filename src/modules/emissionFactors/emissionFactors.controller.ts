import { Request, Response, NextFunction } from "express";
import { 
  createEmissionFactor, 
  getEmissionFactors, 
  getEmissionFactorById, 
  updateEmissionFactor, 
  deactivateEmissionFactor 
} from "./emissionFactors.service";
import { createEmissionFactorSchema, updateEmissionFactorSchema } from "./emissionFactors.validator";

export const createController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createEmissionFactorSchema.parse(req.body);
    const result = await createEmissionFactor(validated);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAllController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      category: req.query.category,
      scope: req.query.scope,
      country: req.query.country as string,
      region: req.query.region as string,
      status: req.query.status,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await getEmissionFactors(filters);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factor = await getEmissionFactorById(req.params.id as string);
    return res.status(200).json({ success: true, data: factor });
  } catch (error) {
    next(error);
  }
};

export const updateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateEmissionFactorSchema.parse(req.body);
    const result = await updateEmissionFactor(req.params.id as string, validated);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deactivateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deactivateEmissionFactor(req.params.id as string);
    return res.status(200).json({ success: true, message: "Emission factor deactivated successfully" });
  } catch (error) {
    next(error);
  }
};
