import { asyncHandler } from "../../utils/async-handler";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { sanitizeUser } from "./user.service";
import { WalletService } from "../wallet/wallet.service";
import { SYSTEM_RULES } from "../../config/constants";

export class UserController {
  static getMe = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: sanitizeUser(req.user)
    });
  });

  static getDashboard = asyncHandler(async (req, res) => {
    const wallet = await WalletService.getWalletOrFail(req.user._id);

    const validReferralCount = req.user.validReferralCount;
    const totalExtraReferrals = Math.max(
      validReferralCount - SYSTEM_RULES.VALID_REFERRALS_FOR_MAX_POWER,
      0
    );
    const availableExtraReferrals = Math.max(
      totalExtraReferrals - req.user.rewardReferralUsedCount,
      0
    );

    res.json({
      success: true,
      data: {
        wallet: {
          availableUSDT: wallet.availableUSDT,
          lockedUSDT: wallet.lockedUSDT
        },
        referrals: {
          validReferralCount,
          activePowerPercent: req.user.activePowerPercent,
          maxPowerPercent: SYSTEM_RULES.MAX_POWER_PERCENT,
          referralsToMaxPower: Math.max(
            SYSTEM_RULES.VALID_REFERRALS_FOR_MAX_POWER - validReferralCount,
            0
          ),
          extraReferralsAvailable: availableExtraReferrals,
          rewardMachinesClaimable: Math.floor(
            availableExtraReferrals / SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE
          )
        },
        withdrawals: {
          minWithdrawalUSDT: SYSTEM_RULES.MIN_WITHDRAWAL_USDT,
          cooldownHours: SYSTEM_RULES.WITHDRAWAL_COOLDOWN_HOURS,
          lastWithdrawalRequestedAt: req.user.lastWithdrawalRequestedAt
        }
      }
    });
  });
}
