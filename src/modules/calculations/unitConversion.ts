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
    let energyMultiplier = 1;
    
    // Standard IPCC Default NCVs (approximate)
    if (category === "DIESEL" || category === "GENERATOR_FUEL" || category === "BOILER_FUEL") {
      if (normalizedActivityUnit === "l") {
        // Diesel: ~36 MJ/L => 0.000036 TJ/L
        energyMultiplier = 0.000036;
      }
    } else if (category === "PETROL") {
      if (normalizedActivityUnit === "l") {
        // Petrol: ~34.2 MJ/L => 0.0000342 TJ/L
        energyMultiplier = 0.0000342;
      }
    } else if (category === "LPG") {
      if (normalizedActivityUnit === "kg") {
        // LPG: ~47.3 MJ/kg => 0.0000473 TJ/kg
        energyMultiplier = 0.0000473;
      }
    } else if (category === "CNG" || category === "NATURAL_GAS") {
      if (normalizedActivityUnit === "kg") {
        // CNG: ~48 MJ/kg => 0.000048 TJ/kg
        energyMultiplier = 0.000048;
      } else if (normalizedActivityUnit === "m3") {
        // Natural Gas: ~38 MJ/m3 => 0.000038 TJ/m3
        energyMultiplier = 0.000038;
      }
    }

    if (energyMultiplier === 1) {
       throw new Error(`PENDING: Cannot automatically convert volume/mass (${activityUnit}) to energy (${tUnit}) for ${category}. Custom NCV configuration is required.`);
    }

    let energyResult = quantity * energyMultiplier;
    
    if (tUnit === "gj") {
      energyResult = energyResult * 1000;
    }
    
    return energyResult;
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
