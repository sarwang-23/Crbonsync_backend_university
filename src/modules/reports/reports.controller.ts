import { Request, Response, NextFunction } from "express";
import { generateReport, generateReportPdf, getReports, getReportById } from "./reports.service";
import { logEvent } from "../auditLogs/auditLogs.service";
import { AuditAction } from "../../generated/prisma/client";
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

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const universityId = req.query.universityId ? String(req.query.universityId) : "";
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
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const download = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getReportById(String(req.params.id));
    if (!report || report.status !== "GENERATED" || !report.filePath) {
      return res.status(404).json({ success: false, message: "Report not found or not ready" });
    }

    const normalizedPath = path.resolve(report.filePath);
    const reportsDir = path.resolve(process.cwd(), "storage/reports");
    
    if (!normalizedPath.startsWith(reportsDir)) {
      return res.status(403).json({ success: false, message: "Invalid file path detected" });
    }

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ success: false, message: "Report file missing from disk" });
    }

    await logEvent(
      AuditAction.REPORT_DOWNLOADED,
      "Report",
      report.id,
      (req as any).user?.userId || null,
      report.universityId,
      null,
      { fileName: report.fileName },
      "Report downloaded"
    );

    res.download(normalizedPath, report.fileName || "carbon-report.pdf");
  } catch (error) { next(error); }
};
