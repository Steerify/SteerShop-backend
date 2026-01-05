import { processPaystackWebhook } from "../../src/modules/payments/webhook.processor";

jest.mock("../../src/config/database", () => ({
  prisma: {
    payment: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    subscriptionPayment: {
      findUnique: jest
        .fn()
        .mockResolvedValue({
          id: "sp-1",
          subscriptionId: "sub-1",
          status: "PENDING",
          subscription: {
            id: "sub-1",
            currentPeriodEnd: new Date().toISOString(),
            amount: 100000,
          },
        }),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({ id: "sp-2" }),
    },
    subscription: {
      findUnique: jest
        .fn()
        .mockResolvedValue({
          id: "sub-1",
          currentPeriodEnd: new Date().toISOString(),
          amount: 100000,
        }),
      update: jest.fn().mockResolvedValue({}),
    },
    revenueTransaction: { create: jest.fn().mockResolvedValue({ id: "rt-1" }) },
  },
}));

describe("webhook.processor", () => {
  it("processes subscription webhook", async () => {
    const payload = {
      event: "charge.success",
      data: {
        reference: "REF123",
        status: "success",
        amount: 100,
        metadata: { subscriptionId: "sub-1" },
      },
    };
    const res = await processPaystackWebhook(payload as any, undefined);
    expect(res).toHaveProperty("message");
    const db = require("../../src/config/database");
    expect(db.prisma.subscriptionPayment.update).toHaveBeenCalled();
    expect(db.prisma.subscription.update).toHaveBeenCalled();
    expect(db.prisma.revenueTransaction.create).toHaveBeenCalled();
  });
});
