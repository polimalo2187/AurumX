import cron from "node-cron";
import { DepositService } from "../modules/deposits/deposit.service";

export function startDepositVerificationCron(): void {
  cron.schedule("*/2 * * * *", async () => {
    try {
      const results = await DepositService.verifyPendingOrders(50);

      if (results.length > 0) {
        console.log(`Deposit verification cron processed ${results.length} order(s)`);
      }
    } catch (error) {
      console.error("Deposit verification cron failed:", error);
    }
  });
}
