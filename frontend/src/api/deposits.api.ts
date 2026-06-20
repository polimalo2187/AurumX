import { apiRequest } from "@/api/client";

export type DepositStatus =
  | "PENDING_PAYMENT"
  | "HASH_SUBMITTED"
  | "VERIFYING"
  | "CONFIRMED"
  | "REJECTED"
  | "EXPIRED"
  | "NEEDS_REVIEW";

export type DepositOrderDTO = {
  id: string;
  userId?: string;
  machinePlanId: string;
  machineName?: string;
  machineSlug?: string;
  expectedAmountUSDT: number;
  currency: "USDT" | string;
  network: "BEP20" | "BSC" | string;
  tokenStandard?: "BEP20" | string;
  depositAddress: string;
  userSubmittedTxHash?: string | null;
  status: DepositStatus | string;
  verificationStatus?: string | null;
  confirmedAmountUSDT?: number | null;
  rejectionReason?: string;
  expiresAt?: string;
  submittedAt?: string | null;
  confirmedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type DepositSubmitResultDTO = {
  status: DepositStatus | string;
  message: string;
  order?: DepositOrderDTO;
  machine?: unknown;
  machineId?: string;
};

export const depositsApi = {
  createOrder(machinePlanId: string) {
    return apiRequest<DepositOrderDTO>("/deposits/orders", {
      method: "POST",
      body: JSON.stringify({ machinePlanId })
    });
  },
  submitHash(orderId: string, txHash: string) {
    return apiRequest<DepositSubmitResultDTO>(`/deposits/orders/${orderId}/submit-hash`, {
      method: "POST",
      body: JSON.stringify({ txHash })
    });
  },
  myDeposits() {
    return apiRequest<DepositOrderDTO[]>("/deposits/my");
  }
};
