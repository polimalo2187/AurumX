import { z } from "zod";
import { asyncHandler } from "../../utils/async-handler";
import { NotificationService } from "./notification.service";

const runNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(50)
});

export class NotificationController {
  static runPending = asyncHandler(async (req, res) => {
    const query = runNotificationsQuerySchema.parse(req.query);
    const result = await NotificationService.sendPending(query.limit);
    res.json({ success: true, data: result });
  });
}
