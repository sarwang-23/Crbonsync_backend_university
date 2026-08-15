import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateRequest = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (target === 'body') schema.parse(req.body);
      else if (target === 'query') schema.parse(req.query);
      else if (target === 'params') schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).json({
          success: false,
          message: "Validation Error",
          errors: (error as any).errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// Keep old `validate` for backwards compatibility
export const validate = (schema: ZodSchema) => validateRequest(schema, 'body');
