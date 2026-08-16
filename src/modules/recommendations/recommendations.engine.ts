import { RecommendationPayload } from "./recommendations.types";

// Impact thresholds
const HIGH_PCT_THRESHOLD = 30;   // Category responsible for >30% of total = HIGH
const MED_PCT_THRESHOLD = 15;    // >15% = MEDIUM

// Friendly labels for categories
const CATEGORY_LABELS: Record<string, string> = {
  PURCHASED_ELECTRICITY: "Electricity Consumption",
  DIESEL: "Diesel Consumption",
  PETROL: "Petrol Consumption",
  NATURAL_GAS: "Natural Gas Consumption",
  LPG: "LPG Consumption",
  CNG: "CNG Consumption",
  GENERATOR_FUEL: "Generator Fuel Usage",
  BOILER_FUEL: "Boiler Fuel Usage",
  REFRIGERANT: "Refrigerant Leakage",
  OWNED_VEHICLE: "Owned Vehicle Emissions",
  PURCHASED_STEAM: "Purchased Steam",
  PURCHASED_HEATING: "Purchased Heating",
  PURCHASED_COOLING: "Purchased Cooling",
};

const CATEGORY_GROUP: Record<string, string> = {
  PURCHASED_ELECTRICITY: "ENERGY",
  PURCHASED_STEAM: "ENERGY",
  PURCHASED_HEATING: "ENERGY",
  PURCHASED_COOLING: "ENERGY",
  DIESEL: "FUEL",
  PETROL: "FUEL",
  LPG: "FUEL",
  NATURAL_GAS: "FUEL",
  CNG: "FUEL",
  GENERATOR_FUEL: "FUEL",
  BOILER_FUEL: "FUEL",
  REFRIGERANT: "REFRIGERANTS",
  OWNED_VEHICLE: "TRANSPORT",
};

const CATEGORY_ACTIONS: Record<string, string> = {
  PURCHASED_ELECTRICITY: "Identify high-consumption buildings and implement energy-efficiency measures such as LED lighting, smart HVAC controls, and solar panels.",
  DIESEL: "Review diesel generator usage frequency and explore switching to grid power or renewable energy alternatives.",
  PETROL: "Encourage carpooling, explore EV fleet transition, and optimize vehicle usage policies.",
  NATURAL_GAS: "Audit heating systems, improve insulation, and explore electrification of heating processes.",
  LPG: "Review LPG usage and explore natural gas or electric alternatives where feasible.",
  CNG: "Optimize fleet routing and explore EV alternatives for short-range vehicles.",
  GENERATOR_FUEL: "Assess backup power needs, implement UPS systems, and reduce reliance on diesel generators.",
  BOILER_FUEL: "Upgrade to high-efficiency boilers and explore heat recovery systems.",
  REFRIGERANT: "Conduct regular leak detection checks, upgrade to low-GWP refrigerants, and train maintenance staff.",
  OWNED_VEHICLE: "Implement a fleet electrification roadmap and encourage sustainable commuting alternatives.",
  PURCHASED_STEAM: "Optimize steam distribution networks and reduce distribution losses.",
  PURCHASED_HEATING: "Improve building insulation and explore district heating alternatives.",
  PURCHASED_COOLING: "Upgrade to energy-efficient cooling systems and optimize thermostat setpoints.",
};

export class RecommendationEngine {
  evaluateRules(data: any): RecommendationPayload[] {
    const recommendations: RecommendationPayload[] = [];
    const { universityId, categoryMap = {}, totalEmissions = 0, intensity, dataQuality } = data;

    // Rule 1: Category-based emission dominance
    for (const [category, stats] of Object.entries(categoryMap) as [string, { tCO2e: number; pct: number }][]) {
      const label = CATEGORY_LABELS[category] || category.replace(/_/g, " ");
      const group = CATEGORY_GROUP[category] || "OTHER";
      const action = CATEGORY_ACTIONS[category] || `Review ${label.toLowerCase()} and implement reduction measures.`;

      if (stats.pct >= HIGH_PCT_THRESHOLD && stats.tCO2e > 0) {
        recommendations.push({
          universityId,
          category: group,
          title: `Reduce ${label}`,
          description: `${label} accounts for ${stats.pct.toFixed(1)}% of total emissions (${stats.tCO2e.toFixed(1)} tCO₂e). This is your single largest emission source. ${action}`,
          priority: "HIGH",
          estimatedReductionKg: stats.tCO2e * 1000 * 0.2 // assume 20% reduction potential
        });
      } else if (stats.pct >= MED_PCT_THRESHOLD && stats.pct < HIGH_PCT_THRESHOLD && stats.tCO2e > 0) {
        recommendations.push({
          universityId,
          category: group,
          title: `Optimize ${label}`,
          description: `${label} contributes ${stats.pct.toFixed(1)}% of total emissions (${stats.tCO2e.toFixed(1)} tCO₂e). ${action}`,
          priority: "MEDIUM",
          estimatedReductionKg: stats.tCO2e * 1000 * 0.15
        });
      }
    }

    // Rule 2: High electricity intensity (kWh per sqm)
    if (intensity?.electricityKwhPerSqm > 150) {
      const existing = recommendations.find(r => r.title.toLowerCase().includes("electricity"));
      if (!existing) {
        recommendations.push({
          universityId,
          category: "ENERGY",
          title: "HVAC and Lighting Audit Required",
          description: `Electricity intensity is ${intensity.electricityKwhPerSqm.toFixed(0)} kWh/m², which exceeds the recommended 150 kWh/m² benchmark. Conduct an energy audit of HVAC systems and lighting infrastructure.`,
          priority: "HIGH",
          estimatedReductionKg: 8000
        });
      }
    }

    // Rule 3: Low data quality score
    if (dataQuality?.qualityScore < 70) {
      recommendations.push({
        universityId,
        category: "DATA_QUALITY",
        title: "Improve Data Completeness",
        description: `Data quality score is ${dataQuality.qualityScore}% (below 70% threshold). Incomplete data leads to inaccurate carbon accounting. Verify all activities and upload supporting documents.`,
        priority: "MEDIUM",
      });
    } else if (dataQuality?.qualityScore < 85) {
      recommendations.push({
        universityId,
        category: "DATA_QUALITY",
        title: "Data Completion Reminder",
        description: `Data quality score is ${dataQuality.qualityScore}%. Complete the remaining unverified activities and calculation gaps to achieve an Excellent rating.`,
        priority: "LOW",
      });
    }

    // Rule 4: Refrigerant emissions (any amount is concerning)
    if (categoryMap["REFRIGERANT"]?.tCO2e > 0) {
      const existing = recommendations.find(r => r.category === "REFRIGERANTS");
      if (!existing) {
        recommendations.push({
          universityId,
          category: "REFRIGERANTS",
          title: "Refrigerant Leak Management",
          description: `Refrigerant leakage detected (${categoryMap["REFRIGERANT"].tCO2e.toFixed(2)} tCO₂e). Refrigerants have very high global warming potential. Implement quarterly leak detection audits and consider upgrading to low-GWP alternatives.`,
          priority: "HIGH",
          estimatedReductionKg: categoryMap["REFRIGERANT"].tCO2e * 1000 * 0.5
        });
      }
    }

    return recommendations;
  }
}

export const recommendationEngine = new RecommendationEngine();
