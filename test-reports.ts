import { prisma } from "./src/config/prisma";
import { generateReport, generateReportPdf } from "./src/modules/reports/reports.service";

async function runReportTests() {
  console.log("=== STEP 11: REPORTS TESTS ===\n");
  
  const uni = await prisma.university.findFirst();
  if(!uni) { console.log("No university found"); return; }
  
  const rp = await prisma.reportingPeriod.findFirst({ where: { universityId: uni.id } });
  if(!rp) { console.log("No reporting period found"); return; }

  console.log("1. Generating Report Record...");
  const reportRes = await generateReport(uni.id, rp.id);
  console.log("Report created:", reportRes);

  console.log("\n2. Generating PDF...");
  const pdfRes = await generateReportPdf(reportRes.reportId);
  console.log("PDF generated:", pdfRes);

  const finalReport = await prisma.report.findUnique({ where: { id: reportRes.reportId } });
  console.log("\n3. Final DB Record:");
  console.log({
    status: finalReport?.status,
    filePath: finalReport?.filePath,
    totalEmissionsKg: finalReport?.totalEmissionsKg,
    scope1Kg: finalReport?.scope1Kg,
    scope2Kg: finalReport?.scope2Kg
  });

  console.log("\n✅ PDF Reports generated successfully!");
}

runReportTests().then(() => process.exit(0)).catch(console.error);
