import cron from "node-cron";
import { env } from "../config/env";
import { DepositService } from "../modules/deposits/deposit.service";
import { JobLockService } from "../modules/jobs/job-lock.service";

export function startDepositVerificationCron(): void {
  cron.schedule("*/2 * * * *", async () => {
    try {
      const lockResult = await JobLockService.withLock(
        "deposit-verification-cron",
        env.JOB_LOCK_TTL_SECONDS,
        async () => DepositService.verifyPendingOrders(50)
      );

      if (!lockResult.acquired) {
        return;
      }

      const results = lockResult.result ?? [];

      if (results.length > 0) {
        console.log(`Deposit verification cron processed ${results.length} order(s)`);
      }
    } catch (error) {
      console.error("Deposit verification cron failed:", error);
    }
  });

  console.log("Deposit verification cron scheduled with persistent lock");
}
