import { Router } from "express";
import { AuthController } from "./auth.controller";

export const authRouter = Router();

authRouter.get("/status", AuthController.status);
authRouter.post("/dev/telegram-verify", AuthController.devTelegramVerify);
authRouter.post("/dev/issue-token", AuthController.issueToken);
