import cron from "node-cron";
import { env } from "../config/env";
import { JobLockService } from "../modules/jobs/job-lock.service";
import { NotificationService } from "../modules/notifications/notification.service";

export function startNotificationCron(): void {
  cron.schedule("*/2 * * * *", async () => {
    try {
      await JobLockService.withLock(
        "notification-cron",
        env.JOB_LOCK_TTL_SECONDS,
        async () => NotificationService.sendPending(50)
      );
    } catch (error) {
      console.error("Notification cron failed:", error);
    }
  });

  console.log("Notification cron scheduled with persistent lock");
}
