import request from "supertest";

jest.mock("../../src/middlewares/auth", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: "user-1", role: "ENTREPRENEUR" };
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
  requireEntrepreneur: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/config/database", () => ({
  prisma: {
    revenueTransaction: {
      create: jest.fn().mockResolvedValue({ id: "rt-1", amount: 100 }),
      findMany: jest.fn().mockResolvedValue([{ id: "rt-1", amount: 100 }]),
      count: jest.fn().mockResolvedValue(1),
    },
  },
}));

import app from "../../src/app";

describe("Revenue endpoints", () => {
  it("creates a revenue transaction (POST)", async () => {
    const res = await request(app)
      .post("/api/v1/revenue/transactions")
      .send({ amount: 100, shopId: "shop-1" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const db = require("../../src/config/database");
    expect(db.prisma.revenueTransaction.create).toHaveBeenCalled();
  });

  it("lists transactions (GET) for admin", async () => {
    const res = await request(app)
      .get("/api/v1/revenue/transactions")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const db = require("../../src/config/database");
    expect(db.prisma.revenueTransaction.findMany).toHaveBeenCalled();
  });
});
