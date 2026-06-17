import { apiRequest } from "@/api/client";

export type DepositOrderDTO = {
  id: string;
  expectedAmountUSDT: number;
  currency: "USDT";
  network: "BEP20" | "BSC";
  depositAddress: string;
  userSubmittedTxHash?: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
};

export const depositsApi = {
  createOrder(machinePlanId: string) {
    return apiRequest<DepositOrderDTO>("/deposits/orders", {
      method: "POST",
      body: JSON.stringify({ machinePlanId })
    });
  },
  submitHash(orderId: string, txHash: string) {
    return apiRequest<{ status: string; message: string; machineId?: string }>(`/deposits/orders/${orderId}/submit-hash`, {
      method: "POST",
      body: JSON.stringify({ txHash })
    });
  },
  myDeposits() {
    return apiRequest<DepositOrderDTO[]>("/deposits/my");
  }
};
