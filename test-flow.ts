import { getEmissionFactor } from "./src/modules/emissionFactors/ef.resolver";
import { calculateActivity } from "./src/modules/calculations/calculations.service";
import { prisma } from "./src/config/prisma";
import { ActivityCategory } from "./src/generated/prisma/client";

async function runTests() {
  console.log("=== STEP 8: EF RESOLVER TESTS ===");
  
  // 1. Electricity (Fixed)
  try {
    const ef1 = await getEmissionFactor({ category: "PURCHASED_ELECTRICITY", country: "IN", year: 2024, activityUnit: "kWh" });
    console.log("1. Electricity:\n", { source: ef1.source, factor: ef1.factor, unit: ef1.unit });
  } catch(e) { console.error("1. Error", e); }

  // 2. Diesel
  try {
    const ef2 = await getEmissionFactor({ category: "DIESEL", country: "IN", year: 2024, activityUnit: "l" });
    console.log("\n2. Diesel:\n", { source: ef2.source, factor: ef2.factor, unit: ef2.unit });
  } catch(e) { console.error("2. Error", e); }

  // 3. Petrol
  try {
    const ef3 = await getEmissionFactor({ category: "PETROL", country: "IN", year: 2024, activityUnit: "l" });
    console.log("\n3. Petrol:\n", { source: ef3.source, factor: ef3.factor, unit: ef3.unit });
  } catch(e) { console.error("3. Error", e); }

  // 4 & 8.1. Climatiq API & Cache
  try {
    console.log("\n4. Fetching Heating (First time API)...");
    const start1 = Date.now();
    const ef4 = await getEmissionFactor({ category: "PURCHASED_HEATING", country: "US", year: 2024, activityUnit: "kWh" });
    console.log(`Heating (took ${Date.now() - start1}ms):\n`, { source: ef4.source, factor: ef4.factor, unit: ef4.unit });

    console.log("\nFetching Heating (Second time Cache)...");
    const start2 = Date.now();
    const ef4_cache = await getEmissionFactor({ category: "PURCHASED_HEATING", country: "US", year: 2024, activityUnit: "kWh" });
    console.log(`Heating (took ${Date.now() - start2}ms):\n`, { source: ef4_cache.source, factor: ef4_cache.factor, unit: ef4_cache.unit });
  } catch(e) { console.error("4. Error", e); }

  // 5. Unknown
  try {
    console.log("\n5. Fetching Unknown Activity...");
    await getEmissionFactor({ category: "PURCHASED_COOLING", country: "UNKNOWN", year: 2024, activityUnit: "km" });
  } catch(e: any) {
    console.log("Unknown Result:\n", { status: e.status, message: e.message });
  }

  console.log("\n=======================================");
  console.log("=== STEP 9: FULL CALCULATION TEST ===");
  // Create dummy ActivityData
  const uni = await prisma.university.findFirst();
  if(!uni) { console.log("No university found, skipping step 9"); return; }
  
  // Ensure country is IN so it hits our Fixed EFs
  await prisma.university.update({ where: { id: uni.id }, data: { country: "IN" } });
  let rp = await prisma.reportingPeriod.findFirst({ where: { universityId: uni.id }});
  if(!rp) {
    rp = await prisma.reportingPeriod.create({
      data: {
        universityId: uni.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "OPEN",
        name: "FY 2024"
      }
    });
  }
  
  // Clean up any old activities from this test
  await prisma.activityData.deleteMany({ where: { description: "TEST_ACTIVITY_REFRIGERANT" } });
  
  const act = await prisma.activityData.create({
    data: {
      universityId: uni.id,
      reportingPeriodId: rp.id,
      category: "PURCHASED_ELECTRICITY",
      scope: "SCOPE_2",
      quantity: 50,
      unit: "MWh",
      status: "VERIFIED",
      description: "TEST_ACTIVITY_ELEC",
      activityDate: new Date()
    }
  });

  try {
    console.log("\nRunning calculateActivity() on 50 MWh PURCHASED_ELECTRICITY...");
    const calc = await calculateActivity(act.id);
    console.log("✅ Calculation created successfully in DB:");
    console.log({
      id: calc.id,
      emissionFactorId: calc.emissionFactorId,
      quantity: calc.quantity,
      activityUnit: calc.activityUnit,
      emissionFactor: calc.emissionFactor,
      factorUnit: calc.factorUnit,
      factorSource: calc.factorSource,
      factorVersion: calc.factorVersion,
      co2eKg: calc.co2eKg,
      status: calc.status
    });
  } catch(e: any) {
    console.error("Calculation failed:", e);
  }
}

runTests().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
