import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      message: "Invalid input data",
      errors: err.issues
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong"
  });
};
