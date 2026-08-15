import { z } from "zod";

export const createCalculationSchema = z.object({
  activityDataId: z.string().uuid("Invalid activity data ID"),
});

export type CreateCalculationInput = z.infer<typeof createCalculationSchema>;
