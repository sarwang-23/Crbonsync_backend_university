import { Request, Response } from "express";

import {
  createUniversity,
  getUniversities,
  getUniversityById,
  updateUniversity,
} from "./universities.service";
import {
  createUniversitySchema,
  updateUniversitySchema,
} from "./universities.validator";

export const createUniversityController = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = createUniversitySchema.parse(req.body);

    const university = await createUniversity(validatedData);

    return res.status(201).json({
      success: true,
      message: "University created successfully",
      data: university,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create university",
    });
  }
};

export const getUniversitiesController = async (
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

    const status =
      typeof req.query.status === "string"
        ? (req.query.status as
            | "ACTIVE"
            | "INACTIVE"
            | "PENDING")
        : undefined;

    const result = await getUniversities({
      page,
      limit,
      search,
      status: status as any, // Cast to any to avoid TS enum mismatch just in case
    });

    return res.status(200).json({
      success: true,
      data: result.universities,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch universities",
    });
  }
};

export const getUniversityByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const university = await getUniversityById(id);

    return res.status(200).json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch university";

    return res.status(404).json({
      success: false,
      message,
    });
  }
};

export const updateUniversityController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const validatedData =
      updateUniversitySchema.parse(req.body);

    const university = await updateUniversity(
      id,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "University updated successfully",
      data: university,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update university";

    return res.status(400).json({
      success: false,
      message,
    });
  }
};
