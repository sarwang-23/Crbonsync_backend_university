import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePdf = async (
  reportData: any
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    const addTitle = (title: string) => {
      doc.fontSize(18).fillColor('#2c3e50').text(title);
      doc.moveDown();
      doc.fillColor('black');
    };

    const addLine = (label: string, value: any) => {
      doc.fontSize(11).text(`${label}: ${value}`);
    };

    // =====================================================
    // 1. COVER PAGE
    // =====================================================
    doc.fontSize(28).fillColor('#2980b9').text("CarbonSynq", { align: "center" });
    doc.moveDown();
    doc.fontSize(22).fillColor('#34495e').text("University Carbon Emissions Report", { align: "center" });
    doc.moveDown(4);
    
    doc.fontSize(14).fillColor('black');
    addLine("University", reportData.universityName);
    addLine("Reporting Period", reportData.reportingPeriodName);
    addLine("Generated At", new Date().toLocaleDateString());
    doc.addPage();

    // =====================================================
    // 2. EXECUTIVE SUMMARY & EMISSIONS
    // =====================================================
    addTitle("1. Executive Summary");
    addLine("Total Emissions", `${reportData.totalEmissionsTonnes} tCO2e`);
    addLine("Scope 1", `${reportData.scope1Tonnes} tCO2e (${reportData.scope1Percentage}%)`);
    addLine("Scope 2", `${reportData.scope2Tonnes} tCO2e (${reportData.scope2Percentage}%)`);
    
    if (reportData.reductionPercentage) {
       addLine("Reduction vs Baseline", `${reportData.reductionPercentage}%`);
    }
    doc.moveDown(2);

    // =====================================================
    // 3. CATEGORY ANALYSIS
    // =====================================================
    addTitle("2. Category-wise Emissions");
    if (reportData.categories && reportData.categories.length) {
      reportData.categories.forEach((cat: any) => {
        addLine(cat.category, `${cat.tonnesCO2e.toFixed(2)} tCO2e (Scope: ${cat.scope})`);
      });
    } else {
      doc.text("No category data available.");
    }
    doc.moveDown(2);

    // =====================================================
    // 4. TOP SOURCES
    // =====================================================
    addTitle("3. Top Emission Sources");
    if (reportData.topSources && reportData.topSources.length) {
      reportData.topSources.slice(0, 5).forEach((source: any, i: number) => {
        addLine(`${i+1}. ${source.category}`, `${source.emissionsTonnes.toFixed(2)} tCO2e`);
      });
    } else {
      doc.text("No source data available.");
    }
    doc.addPage();

    // =====================================================
    // 5. BUILDING & FLOOR ANALYSIS
    // =====================================================
    addTitle("4. Building & Floor Emissions");
    doc.fontSize(14).text("By Building:");
    doc.moveDown(0.5);
    if (reportData.buildings && reportData.buildings.length) {
      reportData.buildings.forEach((b: any) => {
        addLine(b.building, `${b.emissionsTonnes.toFixed(2)} tCO2e`);
      });
    } else {
      doc.text("No building data available.");
    }
    doc.moveDown();

    doc.fontSize(14).text("By Floor:");
    doc.moveDown(0.5);
    if (reportData.floors && reportData.floors.length) {
      reportData.floors.slice(0, 10).forEach((f: any) => {
        addLine(f.floor, `${f.emissionsTonnes.toFixed(2)} tCO2e`);
      });
    } else {
      doc.text("No floor data available.");
    }
    doc.addPage();

    // =====================================================
    // 6. MONTHLY TRENDS
    // =====================================================
    addTitle("5. Monthly Trends");
    if (reportData.trends && reportData.trends.length) {
      reportData.trends.forEach((t: any) => {
        addLine(t.month, `${(t.totalKg / 1000).toFixed(2)} tCO2e`);
      });
    } else {
      doc.text("No monthly trend data available.");
    }
    doc.moveDown(2);

    // =====================================================
    // 7. BASELINE COMPARISON
    // =====================================================
    addTitle("6. Baseline Comparison");
    if (reportData.baseline && !reportData.baseline.error) {
      addLine("Baseline Period", reportData.baseline.baseline?.reportingPeriodName);
      addLine("Baseline Emissions", `${reportData.baseline.baseline?.emissionsTonnes?.toFixed(2)} tCO2e`);
      addLine("Current Emissions", `${reportData.baseline.current?.emissionsTonnes?.toFixed(2)} tCO2e`);
      addLine("Absolute Change", `${reportData.baseline.changeTonnes?.toFixed(2)} tCO2e`);
      addLine("Percentage Change", `${reportData.baseline.reductionPercentage}%`);
    } else {
      doc.text("Baseline comparison not available.");
    }
    doc.addPage();

    // =====================================================
    // 8. EMISSION INTENSITY
    // =====================================================
    addTitle("7. Emission Intensity");
    if (reportData.intensity && !reportData.intensity.error) {
      addLine("Student Count", reportData.intensity.studentCount);
      addLine("Total Area", `${reportData.intensity.totalAreaSqm ?? 0} m²`);
      addLine("Tonnes CO2e / Student", reportData.intensity.tonnesPerStudent?.toFixed(4));
      addLine("kg CO2e / m²", reportData.intensity.kgPerSqm?.toFixed(4));
    } else {
      doc.text("Intensity metrics not available.");
    }
    doc.moveDown(2);

    // =====================================================
    // 9. METHODOLOGY
    // =====================================================
    addTitle("8. Methodology");
    doc.fontSize(11).text("Emission calculations were performed using the following methodology:");
    doc.moveDown();
    doc.text("Activity Data × Applicable Emission Factor = CO2e Emissions");
    doc.moveDown();
    doc.text("Scope 1:");
    doc.text("Fuel Consumption × Fuel Emission Factor = Scope 1 Emissions");
    doc.moveDown();
    doc.text("Scope 2:");
    doc.text("Electricity Consumption × Applicable Grid Emission Factor = Scope 2 Emissions");
    doc.moveDown();
    doc.text("Emission results are presented in kilograms CO2 equivalent (kgCO2e) and tonnes CO2 equivalent (tCO2e).");

    doc.end();
  });
};
