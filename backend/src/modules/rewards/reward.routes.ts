import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { RewardController } from "./reward.controller";

export const rewardRouter = Router();

rewardRouter.post("/run", authMiddleware, RewardController.runDueRewards);
