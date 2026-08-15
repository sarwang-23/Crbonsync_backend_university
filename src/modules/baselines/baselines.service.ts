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
        status: "VERIFIED",
        asset: { floor: { building: { campus: { universityId: data.universityId } } } }
      }
    }
  });

  const scope1KgCO2e = calcs.filter((c: any) => c.scope === "SCOPE_1").reduce((sum: number, c: any) => sum + c.co2eKg, 0);
  const scope2KgCO2e = calcs.filter((c: any) => c.scope === "SCOPE_2").reduce((sum: number, c: any) => sum + c.co2eKg, 0);

  return prisma.baseline.create({
    data: {
      universityId: data.universityId,
      reportingPeriodId: data.reportingPeriodId,
      baselineYear: period.startDate.getFullYear(),
      methodology: data.methodology,
      notes: data.notes,
      scope1KgCO2e,
      scope2KgCO2e,
      totalKgCO2e: scope1KgCO2e + scope2KgCO2e,
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

  let currentTotal = 0;
  if (currentPeriod) {
    const currentCalcs = await prisma.calculation.findMany({
      where: {
        activityData: {
          reportingPeriodId: currentPeriod.id,
          status: "VERIFIED"
        }
      }
    });
    const currentTotalScope1 = currentCalcs.filter((c: any) => c.scope === "SCOPE_1").reduce((sum: number, c: any) => sum + c.co2eKg, 0);
    const currentTotalScope2 = currentCalcs.filter((c: any) => c.scope === "SCOPE_2").reduce((sum: number, c: any) => sum + c.co2eKg, 0);
    currentTotal = currentTotalScope1 + currentTotalScope2;
  }

  const baselineTotal = baseline.totalKgCO2e;
  const reduction = baselineTotal - currentTotal;
  const reductionPercent = baselineTotal > 0 ? (reduction / baselineTotal) * 100 : 0;

  return {
    baseline: baselineTotal / 1000,
    current: currentTotal / 1000,
    reduction: reduction / 1000,
    reductionPercent: Number(reductionPercent.toFixed(2))
  };
};
