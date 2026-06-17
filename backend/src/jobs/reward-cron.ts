import cron from "node-cron";
import { env } from "../config/env";
import { JobLockService } from "../modules/jobs/job-lock.service";
import { RewardService } from "../modules/rewards/reward.service";

export function startRewardCron(): void {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const lockResult = await JobLockService.withLock(
        "reward-cron",
        env.JOB_LOCK_TTL_SECONDS,
        async () => RewardService.runDueRewards(500)
      );

      if (!lockResult.acquired) {
        return;
      }

      const result = lockResult.result;

      if (result && (result.processed > 0 || result.completed > 0)) {
        console.log(
          `Reward cron processed=${result.processed}, completed=${result.completed}, skipped=${result.skipped}`
        );
      }
    } catch (error) {
      console.error("Reward cron failed:", error);
    }
  });

  console.log("Reward cron scheduled with persistent lock");
}
