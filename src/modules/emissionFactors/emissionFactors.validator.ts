import { z } from "zod";

const activityCategoryEnum = z.enum([
  "DIESEL",
  "PETROL",
  "LPG",
  "NATURAL_GAS",
  "CNG",
  "GENERATOR_FUEL",
  "BOILER_FUEL",
  "REFRIGERANT",
  "OWNED_VEHICLE",
  "PURCHASED_ELECTRICITY",
  "PURCHASED_STEAM",
  "PURCHASED_HEATING",
  "PURCHASED_COOLING"
]);

const activityScopeEnum = z.enum(["SCOPE_1", "SCOPE_2"]);

const emissionFactorSourceEnum = z.enum([
  "GOVERNMENT",
  "DEFRA",
  "EPA",
  "IPCC",
  "IEA",
  "GRID_FACTOR",
  "CUSTOM",
  "OTHER"
]);

const emissionFactorStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "PENDING_REVIEW"
]);

export const createEmissionFactorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: activityCategoryEnum,
  scope: activityScopeEnum,
  factor: z.number().positive("Factor must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  source: emissionFactorSourceEnum,
  sourceName: z.string().optional(),
  sourceVersion: z.string().optional(),
  sourceUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  country: z.string().optional(),
  region: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEmissionFactorSchema = createEmissionFactorSchema.partial().extend({
  status: emissionFactorStatusEnum.optional()
});
