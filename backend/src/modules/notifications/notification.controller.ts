import { asyncHandler } from "../../utils/async-handler";
import { NotificationService } from "./notification.service";

export class NotificationController {
  static runPending = asyncHandler(async (_req, res) => {
    const result = await NotificationService.sendPending();
    res.json({ success: true, data: result });
  });
}
