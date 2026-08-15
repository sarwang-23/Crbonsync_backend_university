import { Request, Response } from "express";
import * as xlsx from "xlsx";
import { prisma } from "../../config/prisma";
import { ActivityCategory, ActivityScope, AuditAction } from "../../generated/prisma/client";
import { createAuditLog } from "../auditLogs/auditLogs.service";
import { checkIsolation } from "../../middleware/checkIsolation.middleware";

const scope1Categories = ["DIESEL", "PETROL", "LPG", "NATURAL_GAS", "CNG", "GENERATOR_FUEL", "BOILER_FUEL", "REFRIGERANT", "OWNED_VEHICLE"];
const scope2Categories = ["PURCHASED_ELECTRICITY", "PURCHASED_STEAM", "PURCHASED_HEATING", "PURCHASED_COOLING"];

export const downloadTemplate = (req: Request, res: Response) => {
  const csvContent = `activityDate,category,quantity,unit,building,floor,description
2026-08-01,PURCHASED_ELECTRICITY,10000,kWh,Main Building,Ground Floor,Monthly electricity
2026-08-02,DIESEL,500,L,Generator,,Generator fuel`;
  
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=activity_data_template.csv");
  res.status(200).send(csvContent);
};

export const previewImport = async (req: Request, res: Response) => {
  try {
    const universityId = req.body.universityId as string;
    const reportingPeriodId = req.body.reportingPeriodId as string;

    if (!universityId || !reportingPeriodId) {
      return res.status(400).json({ success: false, message: "universityId and reportingPeriodId are required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { raw: false, dateNF: "yyyy-mm-dd" });

    // Fetch existing buildings and floors
    const buildings = await prisma.building.findMany({
      where: { campus: { universityId } },
      include: { floors: true }
    });

    const parsedRows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2;
      const errors: string[] = [];
      let isDuplicate = false;

      // Date
      let activityDate: Date | null = null;
      if (!row.activityDate) {
        errors.push("Missing required field: activityDate");
      } else {
        activityDate = new Date(row.activityDate);
        if (isNaN(activityDate.getTime())) {
          errors.push("Invalid activityDate format");
        }
      }

      // Category
      let category: string = String(row.category || "").trim().toUpperCase();
      let scope: ActivityScope | undefined;
      if (!category) {
        errors.push("Missing required field: category");
      } else if (!Object.values(ActivityCategory).includes(category as ActivityCategory)) {
        errors.push(`Unknown category: ${category}`);
      } else {
        if (scope1Categories.includes(category)) scope = "SCOPE_1";
        else if (scope2Categories.includes(category)) scope = "SCOPE_2";
      }

      // Quantity
      let quantity: number = parseFloat(row.quantity);
      if (row.quantity === undefined || row.quantity === null || row.quantity === "") {
        errors.push("Missing required field: quantity");
      } else if (isNaN(quantity) || quantity <= 0) {
        errors.push("Quantity must be greater than 0");
      }

      // Unit
      let unit: string = String(row.unit || "").trim();
      if (!unit) {
        errors.push("Missing required field: unit");
      }

      // Building / Floor
      let buildingId: string | undefined;
      let floorId: string | undefined;
      let buildingCode = String(row.building || "").trim();
      let floorCode = String(row.floor || "").trim();

      if (buildingCode) {
        const foundBuilding = buildings.find(b => b.name.toLowerCase() === buildingCode.toLowerCase() || b.code.toLowerCase() === buildingCode.toLowerCase());
        if (!foundBuilding) {
          errors.push(`Building not found: ${buildingCode}`);
        } else {
          buildingId = foundBuilding.id;
          if (floorCode) {
            const foundFloor = foundBuilding.floors.find(f => f.name.toLowerCase() === floorCode.toLowerCase() || f.code.toLowerCase() === floorCode.toLowerCase());
            if (!foundFloor) {
              errors.push(`Floor not found: ${floorCode} in Building: ${buildingCode}`);
            } else {
              floorId = foundFloor.id;
            }
          }
        }
      }

      // Duplicate Check
      if (errors.length === 0 && activityDate) {
        const existing = await prisma.activityData.findFirst({
          where: {
            universityId,
            reportingPeriodId,
            activityDate,
            category: category as ActivityCategory,
            quantity,
            unit
          }
        });
        if (existing) {
          isDuplicate = true;
          // Not strictly an error that prevents import if they choose 'Import Anyway', but we flag it
          // errors.push("Possible duplicate"); // Let frontend handle duplicate warning instead of blocking
        }
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      parsedRows.push({
        row: rowNumber,
        isValid,
        isDuplicate,
        errors,
        data: {
          activityDate,
          category,
          scope,
          quantity,
          unit,
          buildingId,
          floorId,
          description: row.description || undefined,
          rawBuilding: buildingCode,
          rawFloor: floorCode
        }
      });
    }

    // Save job state
    const job = await prisma.importJob.create({
      data: {
        universityId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        totalRows: rawRows.length,
        status: "PREVIEW"
      }
    });

    await createAuditLog({
      action: AuditAction.IMPORT_STARTED,
      entityType: "ImportJob",
      entityId: job.id,
      userId: (req as any).user?.userId || null,
      universityId,
      metadata: { fileName: req.file.originalname, totalRows: rawRows.length },
      description: "Data import preview started"
    });

    // Save temporary JSON for confirm step
    // In production, save to Redis or Object Storage
    const fs = require("fs");
    fs.writeFileSync(`./tmp_import_preview_${job.id}.json`, JSON.stringify(parsedRows));

    return res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        totalRows: rawRows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        rows: parsedRows
      }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to preview import" });
  }
};

export const confirmImport = async (req: Request, res: Response) => {
  try {
    const universityId = req.body.universityId as string;
    const reportingPeriodId = req.body.reportingPeriodId as string;
    const jobId = req.body.jobId as string;
    const sourceFileId = req.body.sourceFileId as string | undefined;

    if (!universityId || !reportingPeriodId || !jobId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    checkIsolation(req, universityId);

    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job || job.status !== "PREVIEW") {
      return res.status(400).json({ success: false, message: "Invalid or expired import job" });
    }

    const fs = require("fs");
    const tmpPath = `./tmp_import_preview_${job.id}.json`;
    if (!fs.existsSync(tmpPath)) {
      await createAuditLog({
        action: AuditAction.IMPORT_FAILED,
        entityType: "ImportJob",
        entityId: jobId,
        userId: (req as any).user?.userId || null,
        universityId,
        description: "Preview data expired"
      });
      return res.status(400).json({ success: false, message: "Preview data expired. Please upload again." });
    }

    const parsedRows = JSON.parse(fs.readFileSync(tmpPath, "utf-8"));
    const userId = (req as any).user?.userId || null;
    
    // Extract valid rows (user might want to skip duplicates, we can filter them if frontend sent a skippedRows array, but for now we import all valid)
    const skippedRows = req.body.skippedRows || []; // Array of row numbers to skip
    
    const rowsToInsert = parsedRows
      .filter((r: any) => r.isValid && !skippedRows.includes(r.row))
      .map((r: any) => ({
        universityId,
        reportingPeriodId,
        category: r.data.category,
        scope: r.data.scope,
        quantity: r.data.quantity,
        unit: r.data.unit,
        activityDate: new Date(r.data.activityDate),
        buildingId: r.data.buildingId || null,
        floorId: r.data.floorId || null,
        description: r.isDuplicate ? `POSSIBLE_DUPLICATE: ${r.data.description || ''}` : r.data.description,
        inputSource: "EXCEL" as const,
        sourceFileId: sourceFileId || null,
        status: "DRAFT" as const,
        enteredById: userId
      }));

    if (rowsToInsert.length === 0) {
      await createAuditLog({
        action: AuditAction.IMPORT_FAILED,
        entityType: "ImportJob",
        entityId: jobId,
        userId,
        universityId,
        description: "No valid rows to import"
      });
      return res.status(400).json({ success: false, message: "No valid rows to import" });
    }

    const result = await prisma.activityData.createMany({
      data: rowsToInsert,
      skipDuplicates: true
    });

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        successfulRows: result.count,
        completedAt: new Date()
      }
    });

    await createAuditLog({
      action: AuditAction.IMPORT_COMPLETED,
      entityType: "ImportJob",
      entityId: jobId,
      userId,
      universityId,
      metadata: { 
        fileName: job.fileName, 
        totalRows: job.totalRows, 
        validRows: result.count, 
        invalidRows: job.totalRows - result.count 
      },
      description: "Data import completed"
    });

    fs.unlinkSync(tmpPath);

    return res.status(200).json({ 
      success: true, 
      message: "Import confirmed successfully", 
      importedRows: result.count 
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to confirm import" });
  }
};
