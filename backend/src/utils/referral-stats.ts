import { SYSTEM_RULES } from "../config/constants";

export type ReferralStatsInput = {
  validReferralCount: number;
  rewardReferralUsedCount: number;
};

export type ReferralStats = {
  validReferralCount: number;
  activePowerPercent: number;
  maxPowerPercent: number;
  referralsNeededForMaxPower: number;
  totalExtraReferrals: number;
  usedExtraReferrals: number;
  availableExtraReferrals: number;
  requiredExtraReferralsPerReward: number;
  claimableRewardMachines: number;
};

export function calculateActivePowerPercent(validReferralCount: number): number {
  return Math.min(
    validReferralCount * SYSTEM_RULES.POWER_PER_VALID_REFERRAL_PERCENT,
    SYSTEM_RULES.MAX_POWER_PERCENT
  );
}

export function calculateReferralStats(input: ReferralStatsInput): ReferralStats {
  const validReferralCount = Math.max(input.validReferralCount, 0);
  const usedExtraReferrals = Math.max(input.rewardReferralUsedCount, 0);
  const totalExtraReferrals = Math.max(
    validReferralCount - SYSTEM_RULES.VALID_REFERRALS_FOR_MAX_POWER,
    0
  );
  const availableExtraReferrals = Math.max(totalExtraReferrals - usedExtraReferrals, 0);

  return {
    validReferralCount,
    activePowerPercent: calculateActivePowerPercent(validReferralCount),
    maxPowerPercent: SYSTEM_RULES.MAX_POWER_PERCENT,
    referralsNeededForMaxPower: Math.max(
      SYSTEM_RULES.VALID_REFERRALS_FOR_MAX_POWER - validReferralCount,
      0
    ),
    totalExtraReferrals,
    usedExtraReferrals,
    availableExtraReferrals,
    requiredExtraReferralsPerReward: SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE,
    claimableRewardMachines: Math.floor(
      availableExtraReferrals / SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE
    )
  };
}
