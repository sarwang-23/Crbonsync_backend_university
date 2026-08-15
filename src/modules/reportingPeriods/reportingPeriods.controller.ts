import { Request, Response, NextFunction } from "express";
import {
  createReportingPeriod,
  getReportingPeriods,
  getReportingPeriodById,
  setBaseline,
  openReportingPeriod,
  lockReportingPeriod,
} from "./reportingPeriods.service";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await createReportingPeriod(req.body);

    return res.status(201).json({
      success: true,
      data: period,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = String(req.query.universityId);

    const periods = await getReportingPeriods(universityId);

    return res.status(200).json({
      success: true,
      data: periods,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await getReportingPeriodById(req.params.id as string);

    return res.status(200).json({
      success: true,
      data: period,
    });
  } catch (error) {
    next(error);
  }
};

export const baseline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await setBaseline(req.params.id as string);

    return res.status(200).json({
      success: true,
      data: period,
      message: "Baseline period updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const open = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await openReportingPeriod(req.params.id as string);

    return res.status(200).json({
      success: true,
      data: period,
    });
  } catch (error) {
    next(error);
  }
};

export const lock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await lockReportingPeriod(req.params.id as string);

    return res.status(200).json({
      success: true,
      data: period,
      message: "Reporting period locked successfully",
    });
  } catch (error) {
    next(error);
  }
};
