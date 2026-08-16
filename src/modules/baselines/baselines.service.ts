import { prisma } from "../../config/prisma";
import { BaselineStatus } from "../../generated/prisma/client";

export const createBaseline = async (data: any) => {
  const period = await prisma.reportingPeriod.findUnique({
    where: { id: data.reportingPeriodId }
  });
  if (!period) throw new Error("Reporting period not found");

  const calcs = await prisma.calculation.findMany({
    where: {
      activityData: {
        reportingPeriodId: period.id,
        status: { in: ["VERIFIED", "CALCULATED"] }
      }
    }
  });

  const scope1KgCO2e = calcs.filter((c: any) => c.scope === "SCOPE_1").reduce((sum: number, c: any) => sum + c.co2eKg, 0);
  const scope2KgCO2e = calcs.filter((c: any) => c.scope === "SCOPE_2").reduce((sum: number, c: any) => sum + c.co2eKg, 0);
  const scope3KgCO2e = calcs.filter((c: any) => c.scope === "SCOPE_3").reduce((sum: number, c: any) => sum + c.co2eKg, 0);

  return prisma.baseline.create({
    data: {
      universityId: data.universityId,
      reportingPeriodId: data.reportingPeriodId,
      baselineYear: period.startDate.getFullYear(),
      methodology: data.methodology,
      notes: data.notes,
      scope1KgCO2e,
      scope2KgCO2e,
      totalKgCO2e: scope1KgCO2e + scope2KgCO2e + scope3KgCO2e,
      status: "DRAFT"
    }
  });
};

export const getBaselines = async (universityId: string) => {
  return prisma.baseline.findMany({ where: { universityId }, include: { reportingPeriod: true }});
};

export const getBaselineById = async (id: string) => {
  const baseline = await prisma.baseline.findUnique({
    where: { id },
    include: {
      university: { select: { id: true, name: true } },
      reportingPeriod: { select: { id: true, name: true, startDate: true, endDate: true } }
    }
  });

  if (!baseline) throw new Error("Baseline not found");

  return {
    id: baseline.id,
    university: baseline.university,
    reportingPeriod: baseline.reportingPeriod,
    emissions: {
      scope1KgCO2e: baseline.scope1KgCO2e,
      scope2KgCO2e: baseline.scope2KgCO2e,
      totalKgCO2e: baseline.totalKgCO2e,
      totalTCO2e: baseline.totalKgCO2e / 1000
    },
    status: baseline.status,
    methodology: baseline.methodology
  };
};

export const changeBaselineStatus = async (id: string, status: BaselineStatus, userId: string) => {
  const updateData: any = { status };
  if (status === "APPROVED") {
    updateData.approvedBy = userId;
    updateData.approvedAt = new Date();
  }
  if (status === "LOCKED") {
    updateData.lockedAt = new Date();
    updateData.isLocked = true;
  }
  
  return prisma.baseline.update({
    where: { id },
    data: updateData
  });
};

export const getBaselineComparison = async (id: string) => {
  const baseline = await prisma.baseline.findUnique({
    where: { id },
    include: { reportingPeriod: true }
  });
  if (!baseline) throw new Error("Baseline not found");

  const currentPeriod = await prisma.reportingPeriod.findFirst({
    where: { universityId: baseline.universityId, status: "OPEN" },
    orderBy: { startDate: "desc" }
  });

  let currentCalcs: any[] = [];
  if (currentPeriod) {
    currentCalcs = await prisma.calculation.findMany({
      where: {
        activityData: {
          reportingPeriodId: currentPeriod.id,
          status: { in: ["VERIFIED", "CALCULATED"] }
        }
      },
      include: {
        activityData: true
      }
    });
  }

  let baselineCalcs: any[] = [];
  if (baseline.reportingPeriodId) {
    baselineCalcs = await prisma.calculation.findMany({
      where: {
        activityData: {
          reportingPeriodId: baseline.reportingPeriodId,
          status: { in: ["VERIFIED", "CALCULATED"] }
        }
      },
      include: {
        activityData: true
      }
    });
  }

  // Calculate totals
  const currentTotal = currentCalcs.reduce((sum, c) => sum + c.co2eKg, 0);
  const baselineTotal = baseline.totalKgCO2e || baselineCalcs.reduce((sum, c) => sum + c.co2eKg, 0);
  const reduction = baselineTotal - currentTotal;
  const reductionPercent = baselineTotal > 0 ? (reduction / baselineTotal) * 100 : 0;

  // Calculate scope breakdowns
  const scopes = ["SCOPE_1", "SCOPE_2", "SCOPE_3"];
  const scopeData = scopes.map(scope => {
    const baseVal = baselineCalcs.filter(c => c.scope === scope).reduce((sum, c) => sum + c.co2eKg, 0);
    const currVal = currentCalcs.filter(c => c.scope === scope).reduce((sum, c) => sum + c.co2eKg, 0);
    const change = baseVal - currVal;
    return {
      scope,
      baseline: baseVal / 1000,
      current: currVal / 1000,
      change: change / 1000,
      changePercent: baseVal > 0 ? (change / baseVal) * 100 : 0
    };
  });

  // Calculate category breakdowns
  const categories = new Set([...baselineCalcs, ...currentCalcs].map(c => c.activityData.category));
  const categoryData = Array.from(categories).map(category => {
    const baseVal = baselineCalcs.filter(c => c.activityData.category === category).reduce((sum, c) => sum + c.co2eKg, 0);
    const currVal = currentCalcs.filter(c => c.activityData.category === category).reduce((sum, c) => sum + c.co2eKg, 0);
    const change = baseVal - currVal;
    return {
      category,
      baseline: baseVal / 1000,
      current: currVal / 1000,
      change: change / 1000,
      changePercent: baseVal > 0 ? (change / baseVal) * 100 : 0
    };
  }).sort((a, b) => b.baseline - a.baseline);

  return {
    baseline: baselineTotal / 1000,
    current: currentTotal / 1000,
    reduction: reduction / 1000,
    reductionPercent: Number(reductionPercent.toFixed(2)),
    scopeData,
    categoryData,
    baselineYear: baseline.baselineYear
  };
};
