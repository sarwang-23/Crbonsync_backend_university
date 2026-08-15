import { z } from "zod";

export const getStatisticsSchema = z.object({
  universityId: z.string().uuid("Invalid university ID")
});

export const createStatisticSchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
  metricName: z.string().min(1, "Metric name is required"),
  metricValue: z.number(),
  year: z.number().int().min(1900).max(2100)
}).passthrough(); // Allowing passthrough in case there are other fields

export const updateStatisticSchema = z.object({
  metricName: z.string().min(1).optional(),
  metricValue: z.number().optional(),
  year: z.number().int().min(1900).max(2100).optional()
}).passthrough();

export const statisticIdParamSchema = z.object({
  id: z.string().uuid("Invalid statistic ID")
});
