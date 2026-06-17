import { z } from "zod";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/async-handler";
import { forbidden } from "../../utils/errors";
import { TelegramService } from "./telegram.service";

const webhookQuerySchema = z.object({
  secret: z.string().optional()
});

export class TelegramController {
  static webhook = asyncHandler(async (req, res) => {
    const query = webhookQuerySchema.parse(req.query);

    if (env.TELEGRAM_WEBHOOK_SECRET && query.secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      throw forbidden("Invalid Telegram webhook secret", "INVALID_TELEGRAM_WEBHOOK_SECRET");
    }

    const result = await TelegramService.handleWebhook(req.body);
    res.json({ success: true, data: result });
  });
}
