import request from "supertest";
import crypto from "crypto";

jest.mock("../../src/middlewares/auth", () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  optionalAuth: (_req: any, _res: any, next: any) => next(),
  requireEntrepreneur: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/queues/webhook.queue", () => ({
  enqueueWebhook: jest.fn().mockResolvedValue(undefined),
}));

import app from "../../src/app";

describe("POST /api/v1/payments/webhook (async)", () => {
  it("enqueues webhook when WEBHOOK_ASYNC=true", async () => {
    process.env.WEBHOOK_ASYNC = "true";

    const payload = {
      event: "charge.success",
      data: { reference: "RASYNC", status: "success", amount: 100 },
    };
    const secret = process.env.PAYSTACK_SECRET_KEY || "test-secret";
    const signature = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const { enqueueWebhook } = require("../../src/queues/webhook.queue");

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-paystack-signature", signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enqueueWebhook).toHaveBeenCalledWith(payload, signature);

    // Reset env
    process.env.WEBHOOK_ASYNC = "false";
  });
});
