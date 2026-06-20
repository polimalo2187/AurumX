export type UserRole = "USER" | "ADMIN";

export type UserDTO = {
  id: string;
  telegramUsername?: string;
  phoneNumber?: string;
  referralCode: string;
  validReferralCount: number;
  activePowerPercent: number;
  role: UserRole;
  status: "ACTIVE" | "BLOCKED";
};

export type WalletDTO = {
  availableUSDT: number;
  lockedUSDT: number;
};

export type DashboardDTO = {
  wallet: WalletDTO;
  machines: {
    active: number;
    completed: number;
    freeClaimed: boolean;
  };
  referrals: {
    validReferralCount: number;
    activePowerPercent: number;
    maxPowerPercent: number;
    referralsToMaxPower: number;
    extraReferralsAvailable: number;
    rewardMachinesClaimable: number;
  };
  withdrawals: {
    minWithdrawalUSDT: number;
    canRequestWithdrawal: boolean;
    nextWithdrawalAt?: string;
    hasPendingWithdrawal: boolean;
  };
};

export type MachinePlanDTO = {
  id: string;
  _id?: string;
  slug: string;
  name: string;
  type: "FREE" | "PAID" | "REWARD";
  priceUSDT: number;
  virtualPrincipalUSDT: number;
  durationCycles: number;
  cycleHours: number;
  payoutMultiplier: number;
  maxPayoutAmount: number;
  baseCycleRewardAmount: number;
  powerEnabled: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type UserMachineDTO = {
  id: string;
  machinePlanId?: string;
  machineType: "FREE" | "PAID" | "REWARD";
  sourceType?: "FREE_CLAIM" | "PAID_DEPOSIT" | "REFERRAL_REWARD";
  name?: string;
  slug?: string;
  machineName?: string;
  machineSlug?: string;
  principalAmount: number;
  maxPayoutAmount: number;
  paidAmount: number;
  remainingAmount: number;
  baseCycleRewardAmount: number;
  effectiveCycleRewardAmount: number;
  powerPercentApplied: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  activatedAt: string;
  nextRewardAt?: string;
  completedAt?: string;
};

export type TelegramStartResponse = {
  botUrl: string;
  verificationToken: string;
  expiresInMinutes: number;
};

export type AuthResponse = {
  token: string;
  user: UserDTO;
};
