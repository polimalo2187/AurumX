import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),
  TRUST_PROXY: z.coerce.boolean().default(false),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(20, "JWT_SECRET must be at least 20 characters"),
  JWT_EXPIRES_IN: z.string().default("30d"),

  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_BOT_USERNAME: z.string().optional().default(""),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(""),

  APP_PUBLIC_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional().default(""),

  BSC_RPC_URL: z.string().optional().default(""),
  BSC_CHAIN_ID: z.coerce.number().default(56),
  BSC_USDT_CONTRACT_ADDRESS: z.string().optional().default(""),
  PLATFORM_BSC_DEPOSIT_ADDRESS: z.string().optional().default(""),

  MIN_BSC_CONFIRMATIONS: z.coerce.number().default(12),

  INTERNAL_JOB_SECRET: z.string().optional().default(""),
  JOB_LOCK_TTL_SECONDS: z.coerce.number().default(120),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(300),
  STRICT_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(30),
  TELEGRAM_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120),

  ADMIN_TELEGRAM_IDS: z.string().optional().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const productionRequiredEnvKeys = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_WEBHOOK_SECRET",
  "APP_PUBLIC_URL",
  "FRONTEND_URL",
  "BSC_RPC_URL",
  "BSC_USDT_CONTRACT_ADDRESS",
  "PLATFORM_BSC_DEPOSIT_ADDRESS",
  "INTERNAL_JOB_SECRET"
] as const;

if (parsed.data.NODE_ENV === "production") {
  const missingKeys = productionRequiredEnvKeys.filter((key) => {
    const value = parsed.data[key];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingKeys.length > 0) {
    console.error("Missing required production environment variables:");
    console.error(missingKeys.join(", "));
    process.exit(1);
  }
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

export const adminTelegramIds = env.ADMIN_TELEGRAM_IDS
  ? env.ADMIN_TELEGRAM_IDS.split(",").map((id) => id.trim()).filter(Boolean)
  : [];

export const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : env.FRONTEND_URL
    ? [env.FRONTEND_URL]
    : [];
