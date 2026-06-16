import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { ReferralController } from "./referral.controller";

export const referralRouter = Router();

referralRouter.use(authMiddleware);
referralRouter.get("/me", ReferralController.getMyReferrals);
referralRouter.get("/rewards/status", ReferralController.getRewardStatus);
referralRouter.post("/rewards/claim-machine", ReferralController.claimRewardMachine);
