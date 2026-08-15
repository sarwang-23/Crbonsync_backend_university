import { Request, Response, NextFunction } from "express";
import { calculateActivity } from "./calculations.service";

export const calculate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const calculation = await calculateActivity(req.params.activityId as string);

    return res.status(201).json({
      success: true,
      data: calculation
    });
  } catch (error) {
    next(error);
  }
};
