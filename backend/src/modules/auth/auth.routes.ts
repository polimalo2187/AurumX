import { Router } from "express";
import { AuthController } from "./auth.controller";

export const authRouter = Router();

authRouter.get("/status", AuthController.status);
authRouter.post("/register", AuthController.register);
authRouter.post("/register/complete", AuthController.completeRegistration);
authRouter.post("/login", AuthController.login);
authRouter.post("/telegram/start", AuthController.startTelegramLogin);
authRouter.post("/telegram/complete", AuthController.completeTelegramLogin);
authRouter.post("/dev/telegram-verify", AuthController.devTelegramVerify);
authRouter.post("/dev/issue-token", AuthController.issueToken);
