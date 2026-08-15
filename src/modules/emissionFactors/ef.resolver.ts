import { prisma } from "../../config/prisma";
import { ActivityCategory, ActivityScope } from "../../generated/prisma/client";

export interface ResolvedFactor {
  id: string;
  factor: number;
  unit: string;
  source: string;
  sourceVersion: string | null;
  factorName: string;
}

/**
 * PRIORITY ORDER:
 * 1. Fixed EF (isFixed: true, country + category match)
 * 2. Climatiq Cache (locally stored from a previous API call, matching unit)
 * 3. Climatiq API (fetch dynamically based on activity category/unit, save to cache)
 * 4. No factor → throw structured error
 */
export const getEmissionFactor = async (params: {
  category: ActivityCategory;
  country: string;
  year: number;
  activityUnit: string;
}): Promise<ResolvedFactor> => {
  const { category, country, year, activityUnit } = params;

  // ── Priority 1: Fixed EF ──────────────────────────────────────
  const fixedEF = await prisma.emissionFactor.findFirst({
    where: {
      category,
      country,
      isFixed: true,
      status: "ACTIVE",
      OR: [
        { year: { lte: year } },
        { year: null }
      ]
    },
    orderBy: { year: "desc" }
  });

  if (fixedEF) {
    return {
      id: fixedEF.id,
      factor: fixedEF.factor,
      unit: fixedEF.unit,
      source: fixedEF.sourceName ?? fixedEF.source,
      sourceVersion: fixedEF.sourceVersion ?? null,
      factorName: fixedEF.name
    };
  }

  // ── Priority 2: Climatiq Cache ────────────────────────────────
  const cached = await prisma.climatiqCache.findFirst({
    where: { category, country, year, unit: activityUnit }
  });

  if (cached) {
    const cachedEF = await prisma.emissionFactor.findFirst({
      where: {
        category,
        country,
        source: "CLIMATIQ",
        year,
        status: "ACTIVE"
      }
    });

    if (cachedEF) {
      return {
        id: cachedEF.id,
        factor: cached.factor,
        unit: cached.unit,
        source: "Climatiq",
        sourceVersion: cached.climatiqVersion ?? null,
        factorName: cachedEF.name
      };
    }
  }

  // ── Priority 3: Climatiq API ──────────────────────────────────
  const climatiqKey = process.env.CLIMATIQ_API_KEY;
  if (!climatiqKey) {
    throw {
      status: "PENDING",
      message: `No emission factor available for ${category} in ${country}. Configure CLIMATIQ_API_KEY to enable dynamic lookup.`
    };
  }

  const climatiqResult = await fetchFromClimatiq({ category, country, year, activityUnit, apiKey: climatiqKey });

  if (!climatiqResult) {
    throw {
      status: "PENDING",
      message: `No emission factor found for activity "${category}" in country "${country}" for year ${year}. Manual entry may be required.`
    };
  }

  // Save to ClimatiqCache
  await prisma.climatiqCache.upsert({
    where: { category_country_year_unit: { category, country, year, unit: activityUnit } },
    update: {
      factor: climatiqResult.factor,
      climatiqId: climatiqResult.climatiqId,
      climatiqVersion: climatiqResult.version ?? null,
      fetchedAt: new Date()
    },
    create: {
      category,
      country,
      year,
      factor: climatiqResult.factor,
      unit: activityUnit,
      climatiqId: climatiqResult.climatiqId,
      climatiqVersion: climatiqResult.version ?? null
    }
  });

  // Clean Upsert as EmissionFactor
  const efName = `Climatiq — ${category} (${country} ${year} - ${activityUnit})`;
  const existingDynamic = await prisma.emissionFactor.findFirst({
    where: { category, country, source: "CLIMATIQ", year, status: "ACTIVE" }
  });

  const dynamicEF = existingDynamic 
    ? await prisma.emissionFactor.update({
        where: { id: existingDynamic.id },
        data: {
          factor: climatiqResult.factor,
          unit: climatiqResult.unit,
          sourceVersion: climatiqResult.version ?? null,
          updatedAt: new Date()
        }
      })
    : await prisma.emissionFactor.create({
        data: {
          name: efName,
          category,
          scope: resolveScopeForCategory(category),
          factor: climatiqResult.factor,
          unit: climatiqResult.unit,
          source: "CLIMATIQ",
          sourceName: "Climatiq API",
          sourceVersion: climatiqResult.version ?? null,
          country,
          year,
          isFixed: false,
          status: "ACTIVE",
          notes: `Auto-fetched from Climatiq. Activity ID: ${climatiqResult.climatiqId}`
        }
      });

  return {
    id: dynamicEF.id,
    factor: climatiqResult.factor,
    unit: climatiqResult.unit,
    source: "Climatiq",
    sourceVersion: climatiqResult.version ?? null,
    factorName: efName
  };
};

// ── Climatiq API call ─────────────────────────────────────────────────────────
interface ClimatiqResult {
  factor: number;
  unit: string;
  climatiqId: string;
  version?: string;
}

const CATEGORY_TO_CLIMATIQ_ACTIVITY: Partial<Record<ActivityCategory, string>> = {
  REFRIGERANT: "refrigerant",
  OWNED_VEHICLE: "passenger_vehicle",
  PURCHASED_ELECTRICITY: "electricity-supply_grid-source_residual_mix",
  PURCHASED_STEAM: "heat-networks-steam",
  PURCHASED_HEATING: "heat-networks-hot_water",
  PURCHASED_COOLING: "cooling"
};

async function fetchFromClimatiq(params: {
  category: ActivityCategory;
  country: string;
  year: number;
  activityUnit: string;
  apiKey: string;
}): Promise<ClimatiqResult | null> {
  const activityId = CATEGORY_TO_CLIMATIQ_ACTIVITY[params.category];
  if (!activityId) return null;

  const reqBody: any = {
    emission_factor: {
      activity_id: activityId,
      region: params.country,
      year: params.year,
      data_version: "^36"
    },
    parameters: {}
  };

  let aUnit = params.activityUnit.toLowerCase();
  if (aUnit === "kwh") aUnit = "kWh";
  if (aUnit === "mwh") aUnit = "MWh";
  if (aUnit === "l" || aUnit === "litre" || aUnit === "liter") aUnit = "l";

  // Dynamic payload based on category (Issue #1)
  if (["PURCHASED_ELECTRICITY", "PURCHASED_HEATING", "PURCHASED_COOLING", "PURCHASED_STEAM"].includes(params.category)) {
    reqBody.parameters = { energy: 1, energy_unit: aUnit };
  } else if (params.category === "OWNED_VEHICLE") {
    reqBody.parameters = { distance: 1, distance_unit: aUnit };
  } else if (params.category === "REFRIGERANT") {
    reqBody.parameters = { weight: 1, weight_unit: aUnit };
  } else {
    if (["kg", "t", "tonne", "ton", "g"].includes(aUnit)) {
      reqBody.parameters = { weight: 1, weight_unit: aUnit };
    } else {
      reqBody.parameters = { volume: 1, volume_unit: aUnit };
    }
  }

  try {
    const response = await fetch("https://api.climatiq.io/data/v1/estimate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[EF Resolver] Climatiq API error ${response.status}:`, errBody);
      return null;
    }

    const data = await response.json() as any;
    return {
      factor: data.co2e,
      unit: `${data.co2e_unit}/${data.emission_factor?.unit ?? "unit"}`,
      climatiqId: data.emission_factor?.activity_id ?? activityId,
      version: data.emission_factor?.source_version ?? undefined
    };
  } catch (err: any) {
    console.warn(`[EF Resolver] Climatiq API failed for ${params.category}/${params.country}:`, err?.message);
    return null;
  }
}

// ── Scope helper ──────────────────────────────────────────────────────────────
function resolveScopeForCategory(category: ActivityCategory): ActivityScope {
  const scope2 = [
    "PURCHASED_ELECTRICITY",
    "PURCHASED_STEAM",
    "PURCHASED_HEATING",
    "PURCHASED_COOLING"
  ] as ActivityCategory[];

  return scope2.includes(category) ? "SCOPE_2" : "SCOPE_1";
}
