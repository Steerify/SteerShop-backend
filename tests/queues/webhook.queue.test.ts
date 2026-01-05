jest.useFakeTimers();

jest.mock("../../src/modules/payments/webhook.processor", () => ({
  processPaystackWebhook: jest.fn(),
}));

jest.mock("../../src/config/database", () => ({
  prisma: {
    deadLetter: {
      create: jest.fn().mockResolvedValue({ id: "dl-1" }),
    },
  },
}));

import { processPaystackWebhook } from "../../src/modules/payments/webhook.processor";
import { prisma } from "../../src/config/database";
import { getMetrics } from "../../src/utils/metrics";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("enqueueWebhook retry/backoff behavior", () => {
  it("retries on failure and succeeds before max attempts", async () => {
    process.env.WEBHOOK_MAX_ATTEMPTS = "3";
    process.env.WEBHOOK_BASE_BACKOFF_MS = "10";
    process.env.WEBHOOK_MAX_JITTER_MS = "0";

    // (re)import the module after setting env vars so config picks them up
    const { enqueueWebhook } = require("../../src/queues/webhook.queue");

    let calls = 0;
    (processPaystackWebhook as jest.Mock).mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error("temporary failure");
      return { ok: true };
    });

    const payload = { event: "charge.success", data: { reference: "R1" } };

    const promise = enqueueWebhook(payload, "sig");

    // Advance timers to allow retries (backoff 10ms + jitter 0)
    await jest.advanceTimersByTimeAsync(10);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(20);
    await Promise.resolve();

    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(processPaystackWebhook).toHaveBeenCalledTimes(3);

    // Metrics: two failures -> webhook_processed_failure incremented twice
    const metrics = getMetrics();
    expect(metrics.webhook_processed_failure).toBeGreaterThanOrEqual(2);
    expect(metrics.webhook_retry_attempts).toBeGreaterThanOrEqual(2);
  });

  it("persists to dead letter after max attempts exhausted", async () => {
    process.env.WEBHOOK_MAX_ATTEMPTS = "2";
    process.env.WEBHOOK_BASE_BACKOFF_MS = "5";
    process.env.WEBHOOK_MAX_JITTER_MS = "0";

    // Use real timers for this timing-sensitive test to avoid fake-timer microtask issues
    jest.useRealTimers();
    const { enqueueWebhook } = require("../../src/queues/webhook.queue");

    (processPaystackWebhook as jest.Mock).mockImplementation(async () => {
      throw new Error("permanent failure");
    });

    const payload = { event: "charge.success", data: { reference: "R2" } };

    const promise = enqueueWebhook(payload, "sig");

    // Allow scheduled backoff and persistence to run on real timers
    await new Promise(r => setTimeout(r, 20));

    await expect(promise).rejects.toThrow("permanent failure");

    expect(prisma.deadLetter.create).toHaveBeenCalled();
    const metrics = getMetrics();
    expect(metrics.webhook_deadletter_count).toBeGreaterThanOrEqual(1);

    // Restore fake timers for other tests
    jest.useFakeTimers();
  });
});
