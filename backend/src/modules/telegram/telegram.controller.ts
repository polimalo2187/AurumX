import { z } from "zod";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/async-handler";
import { forbidden } from "../../utils/errors";
import { TelegramService } from "./telegram.service";

const webhookQuerySchema = z.object({
  secret: z.string().optional()
});

const internalQuerySchema = z.object({
  secret: z.string().optional()
});

function validateInternalSecret(secret?: string): void {
  if (!env.INTERNAL_JOB_SECRET || secret !== env.INTERNAL_JOB_SECRET) {
    throw forbidden("Invalid internal secret", "INVALID_INTERNAL_SECRET");
  }
}

export class TelegramController {
  static webhookInfo = asyncHandler(async (req, res) => {
    const query = internalQuerySchema.parse(req.query);
    validateInternalSecret(query.secret);

    const result = await TelegramService.getWebhookInfo();
    res.json({ success: true, data: result });
  });

  static ensureWebhook = asyncHandler(async (req, res) => {
    const query = internalQuerySchema.parse(req.query);
    validateInternalSecret(query.secret);

    const result = await TelegramService.ensureWebhook();
    res.json({ success: true, data: result });
  });

  static webhook = asyncHandler(async (req, res) => {
    const query = webhookQuerySchema.parse(req.query);

    if (env.TELEGRAM_WEBHOOK_SECRET && query.secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      throw forbidden("Invalid Telegram webhook secret", "INVALID_TELEGRAM_WEBHOOK_SECRET");
    }

    const result = await TelegramService.handleWebhook(req.body);
    res.json({ success: true, data: result });
  });
}
