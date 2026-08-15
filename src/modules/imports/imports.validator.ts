import { z } from "zod";
import { ActivityCategory } from "../../generated/prisma/client";

const categorySchema = z.nativeEnum(ActivityCategory);

export const importRowSchema = z.object({
  "Activity Category": z
    .string()
    .transform((val) => val.toUpperCase().trim().replace(/\s+/g, '_'))
    .pipe(categorySchema),
  
  Quantity: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Quantity must be a positive number",
    }),
    
  Unit: z
    .string()
    .trim()
    .min(1, "Unit cannot be empty"),
    
  "Activity Date": z
    .union([z.string(), z.number(), z.date()])
    .transform((val) => {
      // Handle Excel date serial numbers if passed as number
      if (typeof val === 'number') {
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        return jsDate;
      }
      return new Date(val);
    })
    .refine((val) => !isNaN(val.getTime()), {
      message: "Invalid Date format",
    }),
    
  Building: z.string().trim().optional(),
  Floor: z.string().trim().optional(),
  Description: z.string().trim().optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export const validateImportRow = (row: any, rowIndex: number) => {
  const result = importRowSchema.safeParse(row);
  if (!result.success) {
    const errors = result.error.issues.map((err: any) => err.message).join(", ");
    return {
      isValid: false,
      rowIndex,
      errors
    };
  }
  
  return {
    isValid: true,
    rowIndex,
    data: result.data
  };
};
