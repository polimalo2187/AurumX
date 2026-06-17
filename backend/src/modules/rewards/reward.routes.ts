import { Router } from "express";
import { internalOrAdminMiddleware } from "../../middlewares/internal-or-admin.middleware";
import { RewardController } from "./reward.controller";

export const rewardRouter = Router();

rewardRouter.post("/run", internalOrAdminMiddleware, RewardController.runDueRewards);
