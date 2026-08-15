import request from "supertest";
import app from "../src/server";
import { prismaMock } from "./prisma.mock";

describe("Documents API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Test 1 - Should reject upload without file", async () => {
    const response = await request(app)
      .post("/api/v1/documents/upload")
      .field("universityId", "uni-1");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("No file provided");
  });
});
