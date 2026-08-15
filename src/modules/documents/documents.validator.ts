import { z } from "zod";

const documentTypeEnum = z.enum([
  "ELECTRICITY_BILL",
  "FUEL_INVOICE",
  "LPG_INVOICE",
  "NATURAL_GAS_INVOICE",
  "REFRIGERANT_RECORD",
  "METER_READING",
  "VEHICLE_RECORD",
  "OTHER"
]);

export const uploadDocumentBodySchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
  activityDataId: z.string().uuid("Invalid activity data ID").optional(),
  documentType: documentTypeEnum,
  description: z.string().optional(),
});
