import request from "supertest";
import { prismaMock } from "./prisma.mock";

jest.mock("../src/middleware/auth.middleware", () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: "user-1", role: "UNIVERSITY_ADMIN", universityId: "uni-1" };
    next();
  }
}));

jest.mock("../src/middleware/rbac.middleware", () => ({
  authorize: () => (req: any, res: any, next: any) => next()
}));

import app from "../src/server";
import path from "path";

describe("Imports API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Test 1 - Should reject import preview without file", async () => {
    const response = await request(app)
      .post("/api/v1/activity-data/import/preview")
      .field("universityId", "uni-1")
      .field("reportingPeriodId", "rp-1");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("No file uploaded");
  });
});
