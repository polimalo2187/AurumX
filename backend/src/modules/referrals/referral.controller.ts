import { asyncHandler } from "../../utils/async-handler";
import { ReferralService } from "./referral.service";

export class ReferralController {
  static getMyReferrals = asyncHandler(async (req, res) => {
    const data = await ReferralService.getReferralDashboard(req.user);

    res.json({
      success: true,
      data
    });
  });

  static getRewardStatus = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: ReferralService.getReferralStats(req.user)
    });
  });

  static claimRewardMachine = asyncHandler(async (req, res) => {
    const data = await ReferralService.claimRewardMachine(req.user);

    res.status(201).json({
      success: true,
      message: "Aurora activada correctamente",
      data
    });
  });
}
