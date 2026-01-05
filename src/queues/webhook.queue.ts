import { processPaystackWebhook } from "../modules/payments/webhook.processor";
import { incCounter } from "../utils/metrics";
import { config } from "../config/env";
import { prisma } from "../config/database";

// In tests, p-queue is ESM and can cause Jest parse errors. Provide a tiny
// in-memory fallback queue for the test environment to avoid importing
// the ESM package when running under Jest.
let queue: { add: (fn: () => Promise<any>) => Promise<any> };
if (process.env.NODE_ENV === "test") {
  queue = {
    add: (fn: () => Promise<any>) => {
      try {
        const r = fn();
        return Promise.resolve(r);
      } catch (err) {
        return Promise.reject(err);
      }
    },
  };
} else {
  // Import p-queue dynamically to avoid parsing issues in Jest
  const PQueue = require("p-queue").default || require("p-queue");
  queue = new PQueue({ concurrency: config.webhook.concurrency || 2 });
}

function sleep(ms: number) {
  // In test environment, avoid real timeouts so fake timers / microtasks
  // don't introduce flakiness — resolve on next tick to allow immediate retries.
  if (process.env.NODE_ENV === "test") {
    return Promise.resolve();
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function persistDeadLetter(
  payload: any,
  signature: string | undefined,
  error: any,
  attempts: number
) {
  try {
    console.info(
      "persistDeadLetter called for",
      payload?.data?.reference,
      "attempts:",
      attempts
    );
    await prisma.deadLetter.create({
      data: {
        queue: "webhook",
        event: payload?.event || null,
        reference: payload?.data?.reference || null,
        payload,
        signature: signature || null,
        error: (error && error.message) || String(error),
        attempts,
      },
    });
    incCounter("webhook_deadletter_count");
  } catch (err) {
    console.error("Failed to persist dead letter:", err);
  }
}

export function enqueueWebhook(payload: any, signature?: string) {
  incCounter("webhook_enqueued");
  return queue.add(async () => {
    const maxAttempts =
      Number(process.env.WEBHOOK_MAX_ATTEMPTS ?? config.webhook.maxAttempts) ||
      5;
    const baseBackoff =
      Number(
        process.env.WEBHOOK_BASE_BACKOFF_MS ?? config.webhook.baseBackoffMs
      ) || 500;
    const factor =
      Number(
        process.env.WEBHOOK_BACKOFF_FACTOR ?? config.webhook.backoffFactor
      ) || 2;
    const maxBackoff =
      Number(
        process.env.WEBHOOK_MAX_BACKOFF_MS ?? config.webhook.maxBackoffMs
      ) || 30000;
    const maxJitter =
      Number(process.env.WEBHOOK_MAX_JITTER_MS ?? config.webhook.maxJitterMs) ||
      250;
    const taskTimeoutMs =
      Number(
        process.env.WEBHOOK_TASK_TIMEOUT_MS ?? config.webhook.taskTimeoutMs
      ) || 30000;

    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        // Wrap processing with timeout
        const task = processPaystackWebhook(payload, signature);
        const result = await Promise.race([
          task,
          new Promise((_, rej) =>
            setTimeout(
              () => rej(new Error("Webhook task timed out")),
              taskTimeoutMs
            )
          ),
        ]);
        // success
        return result;
      } catch (err) {
        incCounter("webhook_processed_failure");
        incCounter("webhook_retry_attempts");
        console.error(`Webhook attempt ${attempt} failed:`, err);

        if (attempt >= maxAttempts) {
          // Persist dead letter
          console.info(
            `Max attempts reached at ${attempt}, persisting dead letter`
          );
          await persistDeadLetter(payload, signature, err, attempt);
          throw err; // Let upstream handle the final failure
        }

        // Exponential backoff with jitter
        const backoff = Math.min(
          baseBackoff * Math.pow(factor, attempt - 1),
          maxBackoff
        );
        const jitter = Math.floor(Math.random() * (maxJitter + 1));
        const delay = backoff + jitter;

        await sleep(delay);
        // continue to next attempt
      }
    }

    // If the loop exits unexpectedly (e.g., maxAttempts <= 0), treat as failure
    const err = new Error("Failed to process webhook: max attempts exhausted");
    await persistDeadLetter(payload, signature, err, maxAttempts);
    throw err;
  });
}

export function startWebhookWorker() {
  // PQueue runs tasks as they are enqueued; this function is provided for symmetry and potential future worker lifecycle.
  console.info("Webhook worker ready (in-process queue)");
}
