import { z } from "zod";

export const overviewQuerySchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
  reportingPeriodId: z.string().uuid("Invalid reporting period ID"),
});

export const buildingQuerySchema = z.object({
  buildingId: z.string().uuid("Invalid building ID"),
});
