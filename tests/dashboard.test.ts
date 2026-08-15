import { getDashboardOverview } from "../src/modules/dashboard/dashboard.service";
import { prismaMock } from "./prisma.mock";

describe("Dashboard Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Test 1 - Should calculate overview correctly (SUM(co2eKg) == dashboard.total)", async () => {
    // Mock the reporting period check
    prismaMock.reportingPeriod.findFirst.mockResolvedValue({
      id: "rp-1",
      universityId: "uni-1",
      name: "2026-2027",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2027-07-31"),
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock calculations aggregation
    prismaMock.calculation.aggregate.mockResolvedValue({
      _sum: {
        co2eKg: 10000 // Total 10 tCO2e
      },
      _count: undefined,
      _avg: undefined,
      _min: undefined,
      _max: undefined
    });

    // Mock scope breakdown
    (prismaMock.calculation.groupBy as any).mockResolvedValue([
      { scope: "SCOPE_1", _sum: { co2eKg: 4000 } },
      { scope: "SCOPE_2", _sum: { co2eKg: 6000 } }
    ]);

    // Mock active buildings count
    prismaMock.building.count.mockResolvedValue(5);
    // Mock activity count
    prismaMock.activityData.count.mockResolvedValue(20);

    const result = await getDashboardOverview("uni-1");

    expect(result.totalEmissions).toBe(10); // 10000 kg -> 10 tonnes
    expect(result.scopeBreakdown.SCOPE_1).toBe(4);
    expect(result.scopeBreakdown.SCOPE_2).toBe(6);
    expect(result.activeBuildings).toBe(5);
    expect(result.totalActivities).toBe(20);
    expect(result.reportingPeriod).toBe("2026-2027");
  });
});
