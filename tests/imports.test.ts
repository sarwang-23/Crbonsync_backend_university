import request from "supertest";
import app from "../src/server";
import { prismaMock } from "./prisma.mock";
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
