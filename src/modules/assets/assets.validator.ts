import { z } from "zod";

export const createAssetSchema = z.object({
  name: z.string().min(2, "Asset name is required").max(150),
  code: z.string().min(2, "Asset code is required").max(50),
  type: z.enum([
    "ELECTRICITY_METER",
    "SUB_METER",
    "DIESEL_GENERATOR",
    "LPG_EQUIPMENT",
    "NATURAL_GAS_EQUIPMENT",
    "BOILER",
    "CHILLER",
    "AIR_CONDITIONER",
    "REFRIGERATION_SYSTEM",
    "FIRE_SUPPRESSION_SYSTEM",
    "OTHER",
  ]),
  status: z.enum(["ACTIVE", "INACTIVE", "DECOMMISSIONED"]).optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  capacity: z.number().positive().optional(),
  capacityUnit: z.string().max(30).optional(),
  description: z.string().optional(),
  floorId: z.string().uuid("Invalid floor ID"),
});

export const updateAssetSchema = createAssetSchema
  .omit({ floorId: true })
  .partial();

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
