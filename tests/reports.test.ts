import { generateReport } from "../src/modules/reports/reports.service";
import { prismaMock } from "./prisma.mock";

describe("Reports Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Test 1 - Should initiate report generation (Status GENERATING)", async () => {
    prismaMock.reportingPeriod.findUnique.mockResolvedValue({
      id: "rp-1",
      universityId: "uni-1",
      name: "2026-2027",
      status: "OPEN",
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      description: null,
      isBaseline: false
    });

    prismaMock.university.findUnique.mockResolvedValue({ id: "uni-1", name: "Test Uni" } as any);

    prismaMock.report.create.mockResolvedValue({
      id: "rep-1",
      universityId: "uni-1",
      reportingPeriodId: "rp-1",
      name: "Annual Report 2026",
      status: "GENERATING",
      filePath: null,
      fileName: null,
      totalEmissionsKg: null,
      scope1Kg: null,
      scope2Kg: null,
      generatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock calculations check
    prismaMock.calculation.findMany.mockResolvedValue([{ id: "calc-1" } as any]);

    const result = await generateReport("uni-1", "rp-1");

    expect(result.status).toBe("GENERATING");
    expect(result.reportId).toBe("rep-1");
    expect(prismaMock.report.create).toHaveBeenCalled();
  });
});
