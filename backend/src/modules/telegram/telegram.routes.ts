import { Router } from "express";
import { TelegramController } from "./telegram.controller";

export const telegramRouter = Router();

telegramRouter.post("/webhook", TelegramController.webhook);
