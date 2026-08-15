import request from "supertest";
import app from "../src/server";

describe("Health Check API", () => {
  it("should return 200 OK and status for GET /health", async () => {
    const response = await request(app).get("/health");
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("service");
    expect(response.body.service).toContain("CarbonSynq");
  });
});
