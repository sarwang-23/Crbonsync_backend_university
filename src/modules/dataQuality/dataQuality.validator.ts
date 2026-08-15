import { z } from "zod";

export const dataQualityOverviewSchema = z.object({
  universityId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100)
});
