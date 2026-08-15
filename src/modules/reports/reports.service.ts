import { prisma } from "../../config/prisma";
import { 
  getOverview, 
  getScopeBreakdown, 
  getCategoryBreakdown, 
  getBuildingEmissions,
  getFloorEmissions,
  getMonthlyTrends,
  getBaselineComparison,
  getIntensityMetrics,
  getTopSources
} from "../dashboard/dashboard.service";
import { generatePdf } from "./reports.utils";
import { createNotification } from "../notifications/notifications.service";
import path from "path";

export const generateReport = async (universityId: string, reportingPeriodId: string) => {
  // 1. Check if University & RP exist
  const university = await prisma.university.findUnique({ where: { id: universityId } });
  const rp = await prisma.reportingPeriod.findUnique({ where: { id: reportingPeriodId } });
  
  if (!university || !rp) {
    throw new Error("University or Reporting Period not found");
  }

  // 2. Create Report record in GENERATING status
  const report = await prisma.report.create({
    data: {
      universityId,
      reportingPeriodId,
      name: `Carbon Report - ${rp.name}`,
      status: "GENERATING"
    }
  });

  return { reportId: report.id, status: "GENERATING" };
};

export const generateReportPdf = async (reportId: string) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { university: true, reportingPeriod: true }
  });

  if (!report) throw new Error("Report not found");

  try {
    const universityId = report.universityId;
    const reportingPeriodId = report.reportingPeriodId;

    const [
      overview,
      scope,
      categories,
      buildings,
      floors,
      trends,
      baseline,
      intensity,
      topSources
    ] = await Promise.all([
      getOverview(universityId, reportingPeriodId),
      getScopeBreakdown(universityId, reportingPeriodId),
      getCategoryBreakdown(universityId, reportingPeriodId),
      getBuildingEmissions(universityId, reportingPeriodId),
      getFloorEmissions(universityId, reportingPeriodId),
      getMonthlyTrends(universityId, reportingPeriodId),
      getBaselineComparison(universityId, reportingPeriodId),
      getIntensityMetrics(universityId, reportingPeriodId),
      getTopSources(universityId, reportingPeriodId)
    ]);

    const reportData = {
      universityName: report.university.name,
      reportingPeriodName: report.reportingPeriod.name,
      totalEmissionsTonnes: overview.totalEmissionsTonnes,
      scope1Tonnes: scope.scope1.tonnesCO2e,
      scope2Tonnes: scope.scope2.tonnesCO2e,
      scope1Percentage: scope.scope1.percentage.toFixed(2),
      scope2Percentage: scope.scope2.percentage.toFixed(2),
      reductionPercentage: overview.reductionPercentage,
      categories,
      buildings,
      floors,
      trends,
      baseline,
      intensity,
      topSources
    };

    const fileName = `carbon-report-${report.id}.pdf`;
    const filePath = path.join(process.cwd(), "storage/reports", fileName);

    await generatePdf(reportData, filePath);

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "GENERATED",
        filePath,
        fileName,
        totalEmissionsKg: overview.totalEmissionsTonnes * 1000,
        scope1Kg: scope.scope1.kgCO2e,
        scope2Kg: scope.scope2.kgCO2e,
        generatedAt: new Date()
      }
    });
    
    const usersToNotify = await prisma.user.findMany({ where: { universityId: report.universityId } });
    for (const u of usersToNotify) {
      await createNotification(u.id, report.universityId, 'Carbon Report Generated', 'Your carbon emissions report for ' + report.reportingPeriod.name + ' has been generated successfully.', 'REPORT_GENERATED');
    }
    
    return { status: 'GENERATED', filePath, fileName };
  } catch (error) {
    console.error('Failed to generate report:', error);

    await prisma.report.update({
      where: { id: report.id },
      data: { status: "FAILED" }
    });
    throw error;
  }
};

export const getReports = async (universityId: string) => {
  return prisma.report.findMany({
    where: { universityId },
    orderBy: { createdAt: "desc" }
  });
};

export const getReportById = async (id: string) => {
  return prisma.report.findUnique({
    where: { id }
  });
};
