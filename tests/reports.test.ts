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
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prismaMock.report.create.mockResolvedValue({
      id: "rep-1",
      universityId: "uni-1",
      reportingPeriodId: "rp-1",
      name: "Annual Report 2026",
      status: "GENERATING",
      type: "GHG_INVENTORY",
      generatedBy: "user-1",
      filePath: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock calculations check
    prismaMock.calculation.findMany.mockResolvedValue([{ id: "calc-1" } as any]);

    const result = await generateReport({
      universityId: "uni-1",
      reportingPeriodId: "rp-1",
      name: "Annual Report 2026",
      type: "GHG_INVENTORY",
      userId: "user-1"
    });

    expect(result.status).toBe("GENERATING");
    expect(result.id).toBe("rep-1");
    expect(prismaMock.report.create).toHaveBeenCalled();
  });
});
