import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { DepositController } from "./deposit.controller";

export const depositRouter = Router();

depositRouter.use(authMiddleware);
depositRouter.post("/orders", DepositController.createOrder);
depositRouter.post("/orders/:id/submit-hash", DepositController.submitHash);
depositRouter.get("/my", DepositController.getMyOrders);
