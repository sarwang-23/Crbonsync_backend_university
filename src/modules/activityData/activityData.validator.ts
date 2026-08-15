import { z } from "zod";
import { ActivityCategory, ActivityScope } from "../../generated/prisma/client";

const scope1Categories = [
  "DIESEL",
  "PETROL",
  "LPG",
  "NATURAL_GAS",
  "CNG",
  "GENERATOR_FUEL",
  "BOILER_FUEL",
  "REFRIGERANT",
  "OWNED_VEHICLE"
];

const scope2Categories = [
  "PURCHASED_ELECTRICITY",
  "PURCHASED_STEAM",
  "PURCHASED_HEATING",
  "PURCHASED_COOLING"
];

const baseActivityDataSchema = z.object({
  universityId: z.string().uuid(),
  reportingPeriodId: z.string().uuid(),
  campusId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  floorId: z.string().uuid().optional(),
  
  category: z.nativeEnum(ActivityCategory),
  scope: z.nativeEnum(ActivityScope),
  
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1),
  
  activityDate: z.coerce.date(),
  description: z.string().optional()
});

export const createActivityDataSchema = baseActivityDataSchema.refine(data => {
  if (data.scope === "SCOPE_1" && !scope1Categories.includes(data.category)) {
    return false;
  }
  if (data.scope === "SCOPE_2" && !scope2Categories.includes(data.category)) {
    return false;
  }
  return true;
}, {
  message: "Invalid scope and category combination",
  path: ["category"]
});

export const updateActivityDataSchema = baseActivityDataSchema.partial().omit({
  universityId: true,
  reportingPeriodId: true
});
