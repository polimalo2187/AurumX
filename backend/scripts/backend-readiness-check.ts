import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MACHINE_PLAN_SLUGS } from "../src/config/constants";

const root = process.cwd();

const requiredFiles = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".env.example",
  "README.md",
  "src/app.ts",
  "src/server.ts",
  "src/config/env.ts",
  "src/config/constants.ts",
  "src/models/User.model.ts",
  "src/models/Wallet.model.ts",
  "src/models/MachinePlan.model.ts",
  "src/models/UserMachine.model.ts",
  "src/models/DepositOrder.model.ts",
  "src/models/MachineRewardLog.model.ts",
  "src/models/WithdrawalRequest.model.ts",
  "src/models/ReferralPowerEvent.model.ts",
  "src/models/ReferralRewardClaim.model.ts",
  "src/models/AuditLog.model.ts",
  "src/models/Notification.model.ts",
  "src/models/RiskFlag.model.ts"
];

const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_WEBHOOK_SECRET",
  "APP_PUBLIC_URL",
  "FRONTEND_URL",
  "BSC_RPC_URL",
  "BSC_CHAIN_ID",
  "BSC_USDT_CONTRACT_ADDRESS",
  "PLATFORM_BSC_DEPOSIT_ADDRESS",
  "MIN_BSC_CONFIRMATIONS",
  "INTERNAL_JOB_SECRET",
  "CORS_ORIGINS",
  "TRUST_PROXY",
  "JOB_LOCK_TTL_SECONDS",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
  "STRICT_RATE_LIMIT_MAX_REQUESTS",
  "TELEGRAM_RATE_LIMIT_MAX_REQUESTS",
  "RISK_SHARED_WITHDRAWAL_WALLET_USER_COUNT",
  "RISK_SMALL_WITHDRAWAL_USDT",
  "RISK_SMALL_WITHDRAWAL_COUNT_7D",
  "RISK_REFERRAL_SPIKE_COUNT_24H"
];

function fail(message: string): never {
  console.error(`Readiness check failed: ${message}`);
  process.exit(1);
}

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    fail(`missing required file ${file}`);
  }
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
for (const envVar of requiredEnvVars) {
  if (!envExample.includes(`${envVar}=`)) {
    fail(`missing ${envVar} in .env.example`);
  }
}

const seedFile = readFileSync(join(root, "src/seeds/machine-plans.seed.ts"), "utf8");
const requiredMachineSlugReferences = Object.keys(MACHINE_PLAN_SLUGS);
for (const key of requiredMachineSlugReferences) {
  if (!seedFile.includes(`MACHINE_PLAN_SLUGS.${key}`)) {
    fail(`missing MACHINE_PLAN_SLUGS.${key} in machine-plans seed`);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (packageJson.version !== "0.12.0") {
  fail(`package version must be 0.12.0, got ${packageJson.version}`);
}

console.log("Backend readiness check passed");
