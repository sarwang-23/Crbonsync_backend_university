import { z } from "zod";

export const createBaselineSchema = z.object({
  universityId: z.string().uuid(),
  reportingPeriodId: z.string().uuid(),
  methodology: z.string().optional(),
  notes: z.string().optional()
});
