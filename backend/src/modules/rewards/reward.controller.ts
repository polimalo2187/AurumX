import type { Response } from "express";
import { env } from "../../config/env";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { forbidden } from "../../utils/errors";
import { RewardService } from "./reward.service";

export class RewardController {
  static runDueRewards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const internalSecret = req.headers["x-internal-job-secret"];
    const isInternalCall =
      Boolean(env.INTERNAL_JOB_SECRET) && internalSecret === env.INTERNAL_JOB_SECRET;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isInternalCall && !isAdmin) {
      throw forbidden("Reward job access denied", "REWARD_JOB_FORBIDDEN");
    }

    const rawLimit = req.query.limit ? Number(req.query.limit) : 500;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 1000) : 500;
    const result = await RewardService.runDueRewards(limit);

    res.json({
      success: true,
      data: result
    });
  });
}
