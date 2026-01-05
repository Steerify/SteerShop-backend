import request from "supertest";
import crypto from "crypto";

jest.mock("../../src/middlewares/auth", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: "user-1",
      email: "owner@example.com",
      role: "ENTREPRENEUR",
    };
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
  requireEntrepreneur: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

import app from "../../src/app";

const mockSubscription = {
  id: "sub-1",
  currentPeriodEnd: new Date().toISOString(),
  amount: 100000,
};

jest.mock("../../src/config/database", () => ({
  prisma: {
    payment: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: "p-1" }),
    },
    order: {
      update: jest.fn().mockResolvedValue({ id: "o-1" }),
    },
    subscriptionPayment: {
      findUnique: jest.fn().mockResolvedValue({
        id: "sp-1",
        subscriptionId: "sub-1",
        reference: "REF123",
        status: "PENDING",
        subscription: mockSubscription,
      }),
      update: jest.fn().mockResolvedValue({ id: "sp-1", status: "SUCCESS" }),
      create: jest.fn().mockResolvedValue({ id: "sp-2", reference: "REF999" }),
    },
    subscription: {
      findUnique: jest.fn().mockResolvedValue(mockSubscription),
      update: jest.fn().mockResolvedValue({ id: "sub-1" }),
    },
    revenueTransaction: {
      create: jest.fn().mockResolvedValue({ id: "rt-1" }),
    },
  },
}));

describe("POST /api/v1/payments/webhook", () => {
  it("processes an existing subscription payment", async () => {
    const payload = {
      event: "charge.success",
      data: { reference: "REF123", status: "success", amount: 100 },
    };
    const secret = process.env.PAYSTACK_SECRET_KEY || "test-secret";
    const signature = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-paystack-signature", signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { prisma } = require("../../src/config/database");
    expect(prisma.subscriptionPayment.update).toHaveBeenCalled();
    expect(prisma.subscription.update).toHaveBeenCalled();
    expect(prisma.revenueTransaction.create).toHaveBeenCalled();
  });

  it("creates subscriptionPayment from metadata when missing", async () => {
    // Make findUnique return null to simulate missing subscriptionPayment
    const db = require("../../src/config/database");
    db.prisma.subscriptionPayment.findUnique.mockResolvedValueOnce(null);

    const payload = {
      event: "charge.success",
      data: {
        reference: "REF456",
        status: "success",
        amount: 200,
        metadata: { subscriptionId: "sub-1" },
      },
    };

    const secret = process.env.PAYSTACK_SECRET_KEY || "test-secret";
    const signature = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-paystack-signature", signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(db.prisma.subscriptionPayment.create).toHaveBeenCalled();
    expect(db.prisma.subscription.update).toHaveBeenCalled();
    expect(db.prisma.revenueTransaction.create).toHaveBeenCalled();
  });

  it("processes order payment and records revenue", async () => {
    const db = require("../../src/config/database");
    db.prisma.payment.findUnique.mockResolvedValueOnce({
      id: "p-1",
      orderId: "order-1",
      status: "PENDING",
      order: { id: "order-1", shopId: "shop-1" },
    });

    const payload = {
      event: "charge.success",
      data: { reference: "REF_ORDER", status: "success", amount: 5000 },
    };
    const secret = process.env.PAYSTACK_SECRET_KEY || "test-secret";
    const signature = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-paystack-signature", signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(db.prisma.payment.update).toHaveBeenCalled();
    expect(db.prisma.order.update).toHaveBeenCalled();
    expect(db.prisma.revenueTransaction.create).toHaveBeenCalled();
  });

  it("rejects invalid signature and increments failure metric", async () => {
    const payload = {
      event: "charge.success",
      data: { reference: "REF_X", status: "success", amount: 10 },
    };
    const signature = "deadbeef"; // invalid hex or wrong signature
    const metrics = require("../../src/utils/metrics");
    const before = metrics.getMetrics().webhook_processed_failure || 0;

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-paystack-signature", signature)
      .send(payload);

    expect(res.status).toBe(401);
    const after = metrics.getMetrics().webhook_processed_failure || 0;
    expect(after).toBe(before + 1);
  });
});
