import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { WithdrawalController } from "./withdrawal.controller";

export const withdrawalRouter = Router();

withdrawalRouter.use(authMiddleware);
withdrawalRouter.post("/", WithdrawalController.requestWithdrawal);
withdrawalRouter.get("/my", WithdrawalController.getMyWithdrawals);
