import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(20, "JWT_SECRET must be at least 20 characters"),
  JWT_EXPIRES_IN: z.string().default("30d"),

  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_BOT_USERNAME: z.string().optional().default(""),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(""),

  APP_PUBLIC_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),

  BSC_RPC_URL: z.string().optional().default(""),
  BSC_CHAIN_ID: z.coerce.number().default(56),
  BSC_USDT_CONTRACT_ADDRESS: z.string().optional().default(""),
  PLATFORM_BSC_DEPOSIT_ADDRESS: z.string().optional().default(""),

  MIN_BSC_CONFIRMATIONS: z.coerce.number().default(12),

  INTERNAL_JOB_SECRET: z.string().optional().default(""),

  ADMIN_TELEGRAM_IDS: z.string().optional().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

export const adminTelegramIds = env.ADMIN_TELEGRAM_IDS
  ? env.ADMIN_TELEGRAM_IDS.split(",").map((id) => id.trim()).filter(Boolean)
  : [];
