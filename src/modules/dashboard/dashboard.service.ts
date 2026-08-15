import { prisma } from "../../config/prisma";

export const getOverview = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({ where });

  let scope1Kg = 0;
  let scope2Kg = 0;

  for (const calc of calculations) {
    if (calc.scope === "SCOPE_1") scope1Kg += calc.co2eKg;
    if (calc.scope === "SCOPE_2") scope2Kg += calc.co2eKg;
  }

  const totalKg = scope1Kg + scope2Kg;

  // Baseline comparison for reduction percentage
  let reductionPercentage = 0;
  const currentRp = reportingPeriodId 
    ? await prisma.reportingPeriod.findUnique({ where: { id: reportingPeriodId } })
    : null;

  if (currentRp && !currentRp.isBaseline) {
    const baselinePeriod = await prisma.reportingPeriod.findFirst({
      where: { universityId, isBaseline: true }
    });
    
    if (baselinePeriod) {
      const baselineCalcs = await prisma.calculation.findMany({
        where: { universityId, reportingPeriodId: baselinePeriod.id, status: "CALCULATED" }
      });
      const baselineTotalKg = baselineCalcs.reduce((sum, c) => sum + c.co2eKg, 0);
      
      if (baselineTotalKg > 0) {
        const reduction = baselineTotalKg - totalKg;
        reductionPercentage = (reduction / baselineTotalKg) * 100;
      }
    }
  }

  return {
    totalEmissionsTonnes: totalKg / 1000,
    scope1Tonnes: scope1Kg / 1000,
    scope2Tonnes: scope2Kg / 1000,
    reductionPercentage: Number(reductionPercentage.toFixed(2))
  };
};

export const getScopeBreakdown = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({
    where,
    select: { scope: true, co2eKg: true },
  });

  let scope1Kg = 0;
  let scope2Kg = 0;

  for (const calculation of calculations) {
    if (calculation.scope === "SCOPE_1") scope1Kg += calculation.co2eKg;
    if (calculation.scope === "SCOPE_2") scope2Kg += calculation.co2eKg;
  }

  const totalKg = scope1Kg + scope2Kg;

  return {
    scope1: {
      kgCO2e: scope1Kg,
      tonnesCO2e: scope1Kg / 1000,
      percentage: totalKg > 0 ? (scope1Kg / totalKg) * 100 : 0,
    },
    scope2: {
      kgCO2e: scope2Kg,
      tonnesCO2e: scope2Kg / 1000,
      percentage: totalKg > 0 ? (scope2Kg / totalKg) * 100 : 0,
    },
    total: {
      kgCO2e: totalKg,
      tonnesCO2e: totalKg / 1000,
    },
  };
};

export const getCategoryBreakdown = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({
    where,
    include: {
      activityData: {
        select: { category: true },
      },
    },
  });

  const result: Record<string, { scope: string; kgCO2e: number }> = {};

  for (const calculation of calculations) {
    const category = calculation.activityData.category;
    if (!result[category]) {
      result[category] = { scope: calculation.scope, kgCO2e: 0 };
    }
    result[category].kgCO2e += calculation.co2eKg;
  }

  return Object.entries(result).map(([category, value]) => ({
    category,
    scope: value.scope,
    kgCO2e: value.kgCO2e,
    tonnesCO2e: value.kgCO2e / 1000,
  }));
};

export const getTopSources = async (universityId: string, reportingPeriodId?: string) => {
  const categories = await getCategoryBreakdown(universityId, reportingPeriodId);
  return categories
    .map(c => ({
      category: c.category,
      emissionsTonnes: c.tonnesCO2e
    }))
    .sort((a, b) => b.emissionsTonnes - a.emissionsTonnes);
};

export const getBuildingEmissions = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({
    where,
    include: {
      activityData: {
        include: {
          building: true
        }
      }
    }
  });

  const result: Record<string, number> = {};

  for (const calc of calculations) {
    const buildingName = calc.activityData.building?.name || "Unassigned";
    if (!result[buildingName]) result[buildingName] = 0;
    result[buildingName] += calc.co2eKg;
  }

  return Object.entries(result).map(([building, kgCO2e]) => ({
    building,
    emissionsTonnes: kgCO2e / 1000
  })).sort((a, b) => b.emissionsTonnes - a.emissionsTonnes);
};

export const getFloorEmissions = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({
    where,
    include: {
      activityData: {
        include: {
          floor: true,
          building: true
        }
      }
    }
  });

  const result: Record<string, number> = {};

  for (const calc of calculations) {
    const buildingName = calc.activityData.building?.name || "Unassigned";
    const floorName = calc.activityData.floor?.name || "Unassigned";
    const key = `${buildingName} - ${floorName}`;
    
    if (!result[key]) result[key] = 0;
    result[key] += calc.co2eKg;
  }

  return Object.entries(result).map(([floor, kgCO2e]) => ({
    floor,
    emissionsTonnes: kgCO2e / 1000
  })).sort((a, b) => b.emissionsTonnes - a.emissionsTonnes);
};

export const getMonthlyTrends = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({
    where,
    include: {
      activityData: true
    }
  });

  const result: Record<string, { scope1Kg: number, scope2Kg: number, totalKg: number }> = {};

  for (const calc of calculations) {
    if (!calc.activityData.activityDate) continue;
    
    const date = new Date(calc.activityData.activityDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!result[monthKey]) {
      result[monthKey] = { scope1Kg: 0, scope2Kg: 0, totalKg: 0 };
    }
    
    if (calc.scope === "SCOPE_1") result[monthKey].scope1Kg += calc.co2eKg;
    if (calc.scope === "SCOPE_2") result[monthKey].scope2Kg += calc.co2eKg;
    result[monthKey].totalKg += calc.co2eKg;
  }

  return Object.entries(result).map(([month, data]) => ({
    month,
    ...data
  })).sort((a, b) => a.month.localeCompare(b.month));
};

export const getBaselineComparison = async (universityId: string, currentPeriodId: string) => {
  const currentRp = await prisma.reportingPeriod.findUnique({
    where: { id: currentPeriodId }
  });

  if (!currentRp) throw new Error("Current reporting period not found");

  const baselineRp = await prisma.reportingPeriod.findFirst({
    where: { universityId, isBaseline: true }
  });

  if (!baselineRp) {
    return { error: "No baseline period set for this university" };
  }

  const currentCalcs = await prisma.calculation.findMany({
    where: { universityId, reportingPeriodId: currentPeriodId, status: "CALCULATED" }
  });
  
  const baselineCalcs = await prisma.calculation.findMany({
    where: { universityId, reportingPeriodId: baselineRp.id, status: "CALCULATED" }
  });

  const currentTCO2e = currentCalcs.reduce((sum, c) => sum + c.co2eKg, 0) / 1000;
  const baselineTCO2e = baselineCalcs.reduce((sum, c) => sum + c.co2eKg, 0) / 1000;

  const changeTonnes = currentTCO2e - baselineTCO2e;
  const reductionPercentage = baselineTCO2e > 0 ? (changeTonnes / baselineTCO2e) * 100 * -1 : 0; // positive if reduction

  return {
    baseline: {
      period: baselineRp.name,
      emissionsTonnes: Number(baselineTCO2e.toFixed(2))
    },
    current: {
      period: currentRp.name,
      emissionsTonnes: Number(currentTCO2e.toFixed(2))
    },
    changeTonnes: Number(changeTonnes.toFixed(2)),
    reductionPercentage: Number(reductionPercentage.toFixed(2))
  };
};

export const getIntensityMetrics = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId, status: "CALCULATED" };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const calculations = await prisma.calculation.findMany({ where });
  const totalTCO2e = calculations.reduce((sum, c) => sum + c.co2eKg, 0) / 1000;

  // Calculate total building area
  const buildings = await prisma.building.findMany({
    where: { campus: { universityId } },
    include: { floors: true }
  });
  
  let totalAreaSqm = 0;
  for (const b of buildings) {
    for (const f of b.floors) {
      totalAreaSqm += f.areaSqm || 0;
    }
  }

  // TODO: Add studentCount to University model, using dummy for now
  const DUMMY_STUDENT_COUNT = 12000;

  return {
    totalEmissionsTonnes: Number(totalTCO2e.toFixed(2)),
    studentCount: DUMMY_STUDENT_COUNT,
    totalAreaSqm,
    tonnesPerStudent: DUMMY_STUDENT_COUNT > 0 ? Number((totalTCO2e / DUMMY_STUDENT_COUNT).toFixed(4)) : 0,
    kgPerSqm: totalAreaSqm > 0 ? Number(((totalTCO2e * 1000) / totalAreaSqm).toFixed(2)) : 0
  };
};