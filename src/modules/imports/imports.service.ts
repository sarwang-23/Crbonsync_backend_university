import * as xlsx from "xlsx";
import { prisma } from "../../config/prisma";
import { validateImportRow } from "./imports.validator";
import { ActivityScope, ActivityInputSource } from "../../generated/prisma/client";

const determineScope = (category: string): ActivityScope => {
  const scope2Categories = [
    "PURCHASED_ELECTRICITY",
    "PURCHASED_STEAM",
    "PURCHASED_HEATING",
    "PURCHASED_COOLING"
  ];
  return scope2Categories.includes(category) ? ActivityScope.SCOPE_2 : ActivityScope.SCOPE_1;
};

export const processImportBuffer = async (
  buffer: Buffer,
  universityId: string,
  reportingPeriodId: string,
  documentId: string,
  fileName: string,
  publicUrl: string
) => {
  const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Parse to JSON
  const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet);
  
  const validRows = [];
  const invalidRows = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const validation = validateImportRow(row, i + 2); // +2 for 1-index and header row
    
    if (!validation.isValid) {
      invalidRows.push({ row: i + 2, errors: validation.errors });
    } else {
      validRows.push(validation.data);
    }
  }

  return {
    totalParsed: rawRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows
  };
};
