export const convertToEmissionFactorUnit = (
  quantity: number,
  activityUnit: string,
  factorUnitString: string,
  category: string
): number => {
  const aUnit = activityUnit.toLowerCase().trim();
  
  // Extract denominator from factor unit, e.g. "kgCO2e/kWh" -> "kWh", "tCO2/TJ" -> "TJ"
  const parts = factorUnitString.split('/');
  const targetUnitRaw = parts.length > 1 ? parts[1].trim().toLowerCase() : aUnit;
  
  // Normalize target
  let tUnit = targetUnitRaw;
  if (["litre", "liter", "l"].includes(tUnit)) tUnit = "l";
  if (["tonne", "ton", "t"].includes(tUnit)) tUnit = "t";
  
  // Normalize activity
  let normalizedActivityUnit = aUnit;
  if (["litre", "liter", "l"].includes(aUnit)) normalizedActivityUnit = "l";
  if (["tonne", "ton", "t"].includes(aUnit)) normalizedActivityUnit = "t";

  // 1. Direct Match
  if (normalizedActivityUnit === tUnit) {
    return quantity;
  }

  // 2. Mass Conversions
  if (normalizedActivityUnit === "kg" && tUnit === "t") return quantity / 1000;
  if (normalizedActivityUnit === "t" && tUnit === "kg") return quantity * 1000;
  if (normalizedActivityUnit === "g" && tUnit === "kg") return quantity / 1000;
  
  // 3. Energy (Electricity) Conversions
  if (normalizedActivityUnit === "wh" && tUnit === "kwh") return quantity / 1000;
  if (normalizedActivityUnit === "mwh" && tUnit === "kwh") return quantity * 1000;

  // 4. Fuel Energy conversion (Volume/Mass to Energy)
  if (tUnit === "tj" || tUnit === "gj") {
    throw new Error(`PENDING: Cannot automatically convert volume/mass (${activityUnit}) to energy (${tUnit}) for ${category}. Fuel-specific NCV conversion is required.`);
  }

  // 5. Unknown
  throw new Error(`PENDING: Unsupported unit conversion from ${activityUnit} to ${factorUnitString}`);
};

/**
 * Ensures the output is always kgCO2e, regardless of whether the factor is in kgCO2e, tCO2, etc.
 */
export const getCo2eMultiplier = (factorUnitString: string): number => {
  const parts = factorUnitString.split('/');
  const numUnit = parts[0].trim().toLowerCase();
  
  if (numUnit.startsWith('tco2')) return 1000; // tCO2 or tCO2e to kg
  if (numUnit.startsWith('gco2')) return 0.001; // gCO2 or gCO2e to kg
  
  return 1; // Default assumes kgCO2e
};
