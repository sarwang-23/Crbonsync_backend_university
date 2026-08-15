import { prisma } from "./src/config/prisma";
import { 
  getOverview, 
  getScopeBreakdown, 
  getCategoryBreakdown, 
  getTopSources,
  getMonthlyTrends,
  getBuildingEmissions,
  getFloorEmissions,
  getBaselineComparison,
  getIntensityMetrics
} from "./src/modules/dashboard/dashboard.service";

async function runDashboardTests() {
  console.log("=== STEP 10: DASHBOARD TESTS ===\n");
  
  const uni = await prisma.university.findFirst();
  if(!uni) { console.log("No university found"); return; }

  console.log("University ID:", uni.id);
  
  const overview = await getOverview(uni.id);
  console.log("\n1. Overview:");
  console.log(overview);
  console.log("Verify: scope1 + scope2 = total ->", overview.scope1Tonnes + overview.scope2Tonnes === overview.totalEmissionsTonnes);

  const scopeBreakdown = await getScopeBreakdown(uni.id);
  console.log("\n2. Scope Breakdown:");
  console.log(JSON.stringify(scopeBreakdown, null, 2));
  console.log("Verify: kgCO2e / 1000 = tonnesCO2e ->", scopeBreakdown.total.kgCO2e / 1000 === scopeBreakdown.total.tonnesCO2e);

  const categories = await getCategoryBreakdown(uni.id);
  console.log("\n3. Category Breakdown:");
  console.log(categories);

  const topSources = await getTopSources(uni.id);
  console.log("\n4. Top Sources:");
  console.log(topSources);

  const trends = await getMonthlyTrends(uni.id);
  console.log("\n5. Monthly Trends:");
  console.log(trends);

  const buildings = await getBuildingEmissions(uni.id);
  console.log("\n6. Buildings Emissions:");
  console.log(buildings);

  const floors = await getFloorEmissions(uni.id);
  console.log("\n7. Floors Emissions:");
  console.log(floors);
  
  const intensity = await getIntensityMetrics(uni.id);
  console.log("\n8. Intensity Metrics:");
  console.log(intensity);

  console.log("\n✅ Dashboard metrics generated successfully!");
}

runDashboardTests().then(() => process.exit(0)).catch(console.error);
