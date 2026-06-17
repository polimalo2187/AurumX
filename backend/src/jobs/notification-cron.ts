import cron from "node-cron";
import { NotificationService } from "../modules/notifications/notification.service";

let isRunning = false;

export function startNotificationCron(): void {
  cron.schedule("*/2 * * * *", async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      await NotificationService.sendPending(50);
    } catch (error) {
      console.error("Notification cron failed:", error);
    } finally {
      isRunning = false;
    }
  });

  console.log("Notification cron scheduled every 2 minutes");
}
