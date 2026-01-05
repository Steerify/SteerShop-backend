import request from "supertest";

jest.mock("../../src/middlewares/auth", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: "admin-1", role: "ADMIN", email: "admin@example.com" };
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
  requireEntrepreneur: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/config/database", () => ({
  prisma: {
    deadLetter: {
      findMany: jest.fn().mockResolvedValue([{ id: "dl-1", queue: "webhook" }]),
      findUnique: jest.fn().mockResolvedValue({
        id: "dl-1",
        payload: { event: "charge.success", data: { reference: "R1" } },
        signature: "sig",
      }),
      delete: jest.fn().mockResolvedValue({ id: "dl-1" }),
    },
  },
}));

jest.mock("../../src/queues/webhook.queue", () => ({
  enqueueWebhook: jest.fn().mockResolvedValue(undefined),
}));

import app from "../../src/app";

describe("Admin webhook deadletters", () => {
  it("lists dead letters", async () => {
    const res = await request(app).get("/api/v1/admin/webhooks/deadletters");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("reprocesses a dead letter", async () => {
    const res = await request(app).post(
      "/api/v1/admin/webhooks/deadletters/dl-1/reprocess"
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { prisma } = require("../../src/config/database");
    expect(prisma.deadLetter.delete).toHaveBeenCalledWith({
      where: { id: "dl-1" },
    });
  });

  it("deletes a dead letter", async () => {
    const res = await request(app).delete(
      "/api/v1/admin/webhooks/deadletters/dl-1"
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
