import { Router } from "express";
import { TelegramController } from "./telegram.controller";

export const telegramRouter = Router();

telegramRouter.get("/webhook-info", TelegramController.webhookInfo);
telegramRouter.get("/ensure-webhook", TelegramController.ensureWebhook);
telegramRouter.post("/ensure-webhook", TelegramController.ensureWebhook);
telegramRouter.post("/webhook", TelegramController.webhook);
