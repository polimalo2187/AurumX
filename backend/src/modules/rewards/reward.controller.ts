import { z } from "zod";
import { asyncHandler } from "../../utils/async-handler";
import { RewardService } from "./reward.service";

const runRewardsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(500)
});

export class RewardController {
  static runDueRewards = asyncHandler(async (req, res) => {
    const query = runRewardsQuerySchema.parse(req.query);
    const result = await RewardService.runDueRewards(query.limit);

    res.json({
      success: true,
      data: result
    });
  });
}
