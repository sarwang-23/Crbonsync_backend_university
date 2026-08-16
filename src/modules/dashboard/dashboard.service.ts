import { prisma } from "../../config/prisma";

export const getPreviousPeriodId = async (universityId: string, currentPeriodId?: string) => {
  if (!currentPeriodId) return null;
  const currentPeriod = await prisma.reportingPeriod.findUnique({ where: { id: currentPeriodId } });
  if (!currentPeriod) return null;

  const prevPeriod = await prisma.reportingPeriod.findFirst({
    where: {
      universityId,
      endDate: { lte: currentPeriod.startDate },
      status: { in: ["OPEN", "SUBMITTED", "VERIFIED", "LOCKED"] }
    },
    orderBy: { endDate: 'desc' }
  });
  return prevPeriod?.id || null;
};

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

  // Calculate delta compared to previous period
  let delta = 0;
  if (reportingPeriodId) {
    const prevPeriodId = await getPreviousPeriodId(universityId, reportingPeriodId);
    if (prevPeriodId) {
      const prevCalcs = await prisma.calculation.findMany({
        where: { universityId, reportingPeriodId: prevPeriodId, status: "CALCULATED" }
      });
      const prevTotalKg = prevCalcs.reduce((sum, c) => sum + c.co2eKg, 0);
      if (prevTotalKg > 0) {
        delta = ((totalKg - prevTotalKg) / prevTotalKg) * 100;
      }
    }
  }

  return {
    totalEmissionsTonnes: totalKg / 1000,
    scope1Tonnes: scope1Kg / 1000,
    scope2Tonnes: scope2Kg / 1000,
    reductionPercentage: Number(reductionPercentage.toFixed(2)),
    delta: Number(delta.toFixed(2))
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

  let prevResult: Record<string, number> = {};
  if (reportingPeriodId) {
    const prevPeriodId = await getPreviousPeriodId(universityId, reportingPeriodId);
    if (prevPeriodId) {
      const prevCalcs = await prisma.calculation.findMany({
        where: { universityId, reportingPeriodId: prevPeriodId, status: "CALCULATED" },
        include: { activityData: { select: { category: true } } }
      });
      for (const calculation of prevCalcs) {
        const category = calculation.activityData.category;
        if (!prevResult[category]) prevResult[category] = 0;
        prevResult[category] += calculation.co2eKg;
      }
    }
  }

  return Object.entries(result).map(([category, value]) => {
    const prevKg = prevResult[category] || 0;
    let trend = 0;
    if (prevKg > 0) trend = ((value.kgCO2e - prevKg) / prevKg) * 100;
    else if (value.kgCO2e > 0 && prevKg === 0) trend = 100;

    return {
      category,
      scope: value.scope,
      kgCO2e: value.kgCO2e,
      tonnesCO2e: value.kgCO2e / 1000,
      trend: Number(trend.toFixed(1))
    };
  });
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

  // Fetch actual student count from statistics
  const stat = await prisma.universityStatistics.findFirst({
    where: { universityId }
  });
  
  const studentCount = stat?.studentCount || 0;

  return {
    totalEmissionsTonnes: Number(totalTCO2e.toFixed(2)),
    studentCount,
    totalAreaSqm,
    tonnesPerStudent: studentCount > 0 ? Number((totalTCO2e / studentCount).toFixed(4)) : 0,
    kgPerSqm: totalAreaSqm > 0 ? Number(((totalTCO2e * 1000) / totalAreaSqm).toFixed(2)) : 0
  };
};

export const getRecentActivity = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId };
  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;

  const activities = await prisma.activityData.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  return activities.map(a => {
    let statusText = "Synced";
    if (a.status === "UNDER_REVIEW") statusText = "Needs review";
    else if (a.status === "CALCULATED" || a.status === "VERIFIED") statusText = "Processed";

    return {
      source: a.sourceFileName || a.description || `Record ${a.category}`,
      type: a.category.replace(/_/g, ' ').toLowerCase(),
      scope: a.scope === "SCOPE_1" ? "S1" : a.scope === "SCOPE_2" ? "S2" : "S3",
      value: `${a.quantity} ${a.unit}`,
      status: statusText
    };
  });
};

export const getTargets = async (universityId: string) => {
  const targets = await prisma.sustainabilityTarget.findMany({
    where: { universityId },
    orderBy: { targetYear: 'asc' }
  });

  const baseline = await prisma.baseline.findFirst({
    where: { universityId }
  });

  const formattedTargets = [];
  if (baseline) {
    formattedTargets.push({
      label: `${baseline.baselineYear} baseline`,
      value: Math.round(baseline.totalKgCO2e / 1000),
      unit: "tCO₂e",
      complete: false
    });
  }

  for (const t of targets) {
    formattedTargets.push({
      label: `${t.targetYear} target (-${t.reductionPct}%)`,
      value: t.targetCo2eKg ? Math.round(t.targetCo2eKg / 1000) : 0,
      unit: "tCO₂e",
      complete: false
    });
  }

  return formattedTargets;
};

export const getGroupBreakdown = async (universityId: string, reportingPeriodId?: string) => {
  const categories = await getCategoryBreakdown(universityId, reportingPeriodId);
  const totalTonnes = categories.reduce((sum, c) => sum + c.tonnesCO2e, 0);

  const groups = [
    { key: "offices", name: "Offices", icon: "building", value: 0, description: "Energy, water and waste from the owned and leased offices.", items: [] as any[] },
    { key: "logistics", name: "Logistics", icon: "truck", value: 0, description: "Freight, first- and last-mile movement of goods.", items: [] as any[] },
    { key: "travel", name: "Travel", icon: "airplane", value: 0, description: "Employee business travel across flights, rail, hotels and rental cars.", items: [] as any[] },
    { key: "employees", name: "Employees", icon: "users", value: 0, description: "Commuting, remote work energy and employee-owned equipment.", items: [] as any[] },
    { key: "supply-chain", name: "Supply chain", icon: "factory", value: 0, description: "Upstream and downstream emissions across the value chain.", items: [] as any[] }
  ];

  for (const cat of categories) {
    const scopeStr = cat.scope === "SCOPE_1" ? "S1" : cat.scope === "SCOPE_2" ? "S2" : "S3";
    const item = { name: cat.category.replace(/_/g, ' ').toLowerCase(), value: Math.round(cat.tonnesCO2e), scope: scopeStr, trend: cat.trend };
    
    // Ignore scope 3 heavily but place scope 1/2 in correct buckets
    if (["PURCHASED_ELECTRICITY", "PURCHASED_HEATING", "PURCHASED_COOLING", "PURCHASED_STEAM", "NATURAL_GAS", "BOILER_FUEL", "GENERATOR_FUEL"].includes(cat.category)) {
      groups[0].value += cat.tonnesCO2e;
      groups[0].items.push(item);
    } else if (["DIESEL", "PETROL", "CNG", "OWNED_VEHICLE"].includes(cat.category)) {
      groups[1].value += cat.tonnesCO2e;
      groups[1].items.push(item);
    } else {
      groups[0].value += cat.tonnesCO2e;
      groups[0].items.push(item);
    }
  }

  return groups.map(g => {
    let avgTrend = g.items.length ? g.items.reduce((sum, i) => sum + i.trend, 0) / g.items.length : 0;
    return {
      ...g,
      value: Math.round(g.value),
      share: totalTonnes > 0 ? Number((g.value / totalTonnes).toFixed(2)) : 0,
      delta: Number(avgTrend.toFixed(1)),
      spark: []
    };
  }).sort((a, b) => b.value - a.value);
};