import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT access secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT refresh secret must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  PAYSTACK_SECRET_KEY: z.string().min(1, "Paystack secret key is required"),
  PAYSTACK_PUBLIC_KEY: z.string().min(1, "Paystack public key is required"),
  WEBHOOK_ASYNC: z.coerce.boolean().default(false),
  WEBHOOK_CONCURRENCY: z.coerce.number().default(2),
  WEBHOOK_MAX_ATTEMPTS: z.coerce.number().default(5),
  WEBHOOK_BASE_BACKOFF_MS: z.coerce.number().default(500),
  WEBHOOK_MAX_BACKOFF_MS: z.coerce.number().default(30000),
  WEBHOOK_BACKOFF_FACTOR: z.coerce.number().default(2),
  WEBHOOK_MAX_JITTER_MS: z.coerce.number().default(250),
  WEBHOOK_TASK_TIMEOUT_MS: z.coerce.number().default(30000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (process.env.NODE_ENV === "test") {
        console.warn(
          "⚠️ Invalid environment variables in test environment. Applying safe defaults for tests."
        );
        const defaults: Record<string, string> = {
          DATABASE_URL:
            process.env.DATABASE_URL ||
            "mongodb://localhost:27017/steersolo_test",
          JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "a".repeat(32),
          JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "b".repeat(32),
          PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || "sk_test_abc",
          PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || "pk_test_abc",
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "google-client-id",
          GOOGLE_CLIENT_SECRET:
            process.env.GOOGLE_CLIENT_SECRET || "google-client-secret",
        };
        Object.assign(process.env, defaults);
        return envSchema.parse(process.env);
      }
      console.error("❌ Invalid environment variables:");
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  paystack: {
    secretKey: env.PAYSTACK_SECRET_KEY,
    publicKey: env.PAYSTACK_PUBLIC_KEY,
  },
  webhook: {
    async: env.WEBHOOK_ASYNC,
    concurrency: env.WEBHOOK_CONCURRENCY,
    maxAttempts: env.WEBHOOK_MAX_ATTEMPTS,
    baseBackoffMs: env.WEBHOOK_BASE_BACKOFF_MS,
    maxBackoffMs: env.WEBHOOK_MAX_BACKOFF_MS,
    backoffFactor: env.WEBHOOK_BACKOFF_FACTOR,
    maxJitterMs: env.WEBHOOK_MAX_JITTER_MS,
    taskTimeoutMs: env.WEBHOOK_TASK_TIMEOUT_MS,
  },
  cors: {
    origins: env.CORS_ORIGIN.split(",").map(origin => origin.trim()),
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
};
