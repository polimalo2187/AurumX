import { apiRequest } from "@/api/client";

export type ReferralDashboardDTO = {
  referralCode: string;
  referralLink: string;
  validReferralCount: number;
  activePowerPercent: number;
  maxPowerPercent: number;
  referralsNeededForMaxPower: number;
  extraReferralsAvailable: number;
  extraReferralsPerRewardMachine: number;
  rewardMachinesClaimable: number;
};

export type ReferralRewardStatusDTO = {
  validReferralCount: number;
  activePowerPercent: number;
  totalExtraReferrals: number;
  usedExtraReferrals: number;
  availableExtraReferrals: number;
  requiredExtraReferralsPerReward: number;
  claimableRewardMachines: number;
};

export const referralsApi = {
  me() {
    return apiRequest<ReferralDashboardDTO>("/referrals/me");
  },
  rewardStatus() {
    return apiRequest<ReferralRewardStatusDTO>("/referrals/rewards/status");
  },
  claimAurora() {
    return apiRequest<{ message: string }>("/referrals/rewards/claim-machine", {
      method: "POST"
    });
  }
};
