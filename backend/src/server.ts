import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { startDepositVerificationCron } from "./jobs/deposit-verification-cron";
import { startRewardCron } from "./jobs/reward-cron";
import { startNotificationCron } from "./jobs/notification-cron";
import { TelegramService } from "./modules/telegram/telegram.service";

async function ensureTelegramWebhookAfterStart(): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.APP_PUBLIC_URL || !env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn("Telegram webhook setup skipped: TELEGRAM_BOT_TOKEN, APP_PUBLIC_URL or TELEGRAM_WEBHOOK_SECRET is missing");
    return;
  }

  try {
    const result = await TelegramService.ensureWebhook();
    console.log("Telegram webhook ensured", result);
  } catch (error) {
    console.error("Telegram webhook setup failed:", error);
  }
}

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
    void ensureTelegramWebhookAfterStart();
  });
}

bootstrap().catch((error) => {
  console.error("Fatal bootstrap error:", error);
  process.exit(1);
});
