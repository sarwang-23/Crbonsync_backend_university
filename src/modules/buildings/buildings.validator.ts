import { z } from "zod";

export const createBuildingSchema = z.object({
  name: z.string().min(2, "Building name is required"),
  code: z.string().min(2, "Building code is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  campusId: z.string().uuid("Valid campus ID is required"),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;

export const updateBuildingSchema = createBuildingSchema
  .omit({ campusId: true })
  .partial();

export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
