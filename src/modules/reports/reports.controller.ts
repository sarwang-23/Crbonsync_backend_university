import { Request, Response, NextFunction } from "express";
import { generateReport, generateReportPdf, getReports, getReportById } from "./reports.service";
import { createAuditLog } from "../auditLogs/auditLogs.service";
import { AuditAction } from "../../generated/prisma/client";
import { checkIsolation } from "../../middleware/checkIsolation.middleware";
import { supabase } from "../../config/supabase";
import path from "path";
import fs from "fs";

export const generate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { universityId, reportingPeriodId } = req.body;
    if (!universityId || !reportingPeriodId) {
      return res.status(400).json({ success: false, message: "universityId and reportingPeriodId are required" });
    }

    const data = await generateReport(universityId, reportingPeriodId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const generatePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await generateReportPdf(String(req.params.id));
    return res.status(200).json({ success: true, data: report, message: "PDF report generated successfully" });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const universityId = req.query.universityId as string;
    if (!universityId) {
      return res.status(400).json({ success: false, message: "universityId is required" });
    }

    const data = await getReports(universityId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const getSingle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getReportById(String(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Report not found" });
    
    checkIsolation(req, data.universityId);

    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const downloadReport = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id = req.params.id as string;
    const report = await getReportById(id);

    if (!report || report.status !== "GENERATED" || !report.filePath) {
      res.status(404).json({ success: false, message: "Report not found or not ready" });
      return;
    }

    // Check isolation
    checkIsolation(req, report.universityId);

    await createAuditLog({
      action: AuditAction.REPORT_DOWNLOADED,
      entityType: "Report",
      entityId: report.id,
      universityId: report.universityId,
      metadata: { fileName: report.fileName },
      description: "Report downloaded"
    });

    const { data } = supabase.storage
      .from("carbonsynq-reports")
      .getPublicUrl(report.filePath);

    res.status(200).json({ success: true, url: data.publicUrl });
  } catch (error: any) {
    if (error.message === "Forbidden") {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    next(error);
  }
};
