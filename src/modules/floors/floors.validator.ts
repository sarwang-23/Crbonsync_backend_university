import { z } from "zod";

export const createFloorSchema = z.object({
  name: z.string().min(1, "Floor name is required").max(100),
  code: z.string().min(1, "Floor code is required").max(50),
  floorNumber: z.number().int().optional(),
  areaSqm: z.number().positive("Area must be positive").optional(),
  buildingId: z.string().uuid("Invalid building ID"),
});

export type CreateFloorInput = z.infer<typeof createFloorSchema>;

export const updateFloorSchema = createFloorSchema
  .omit({ buildingId: true })
  .partial();

export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;
