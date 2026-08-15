import { getOverview } from "../src/modules/dashboard/dashboard.service";
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

    // Mock calculations findMany
    prismaMock.calculation.findMany.mockResolvedValue([
      { scope: "SCOPE_1", co2eKg: 4000 },
      { scope: "SCOPE_2", co2eKg: 6000 }
    ] as any);

    // Mock active buildings count
    prismaMock.building.count.mockResolvedValue(5);
    // Mock activity count
    prismaMock.activityData.count.mockResolvedValue(20);

    const result = await getOverview("uni-1");

    expect(result.totalEmissionsTonnes).toBe(10);
    expect(result.scope1Tonnes).toBe(4);
    expect(result.scope2Tonnes).toBe(6);
  });
});
