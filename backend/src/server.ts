import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { startDepositVerificationCron } from "./jobs/deposit-verification-cron";
import { startRewardCron } from "./jobs/reward-cron";
import { startNotificationCron } from "./jobs/notification-cron";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  if (env.BSC_RPC_URL && env.BSC_USDT_CONTRACT_ADDRESS && env.PLATFORM_BSC_DEPOSIT_ADDRESS) {
    startDepositVerificationCron();
  }

  startRewardCron();
  startNotificationCron();

  app.listen(env.PORT, () => {
    console.log(`AurumX API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Fatal bootstrap error:", error);
  process.exit(1);
});
