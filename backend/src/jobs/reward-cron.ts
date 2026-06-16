import cron from "node-cron";
import { RewardService } from "../modules/rewards/reward.service";

let isRunning = false;

export function startRewardCron(): void {
  cron.schedule("*/1 * * * *", async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      const result = await RewardService.runDueRewards(500);

      if (result.processed > 0 || result.completed > 0) {
        console.log(
          `Reward cron processed=${result.processed}, completed=${result.completed}, skipped=${result.skipped}`
        );
      }
    } catch (error) {
      console.error("Reward cron failed:", error);
    } finally {
      isRunning = false;
    }
  });

  console.log("Reward cron scheduled");
}
