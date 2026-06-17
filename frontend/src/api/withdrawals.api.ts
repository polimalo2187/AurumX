import { apiRequest } from "@/api/client";

export type WithdrawalDTO = {
  id: string;
  amount: number;
  currency: "USDT";
  network: "BEP20";
  destinationAddress: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminTxHash?: string;
  adminNote?: string;
  requestedAt: string;
  reviewedAt?: string;
};

export const withdrawalsApi = {
  request(amount: number, destinationAddress: string) {
    return apiRequest<{ message: string; withdrawal: WithdrawalDTO }>("/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount, network: "BEP20", destinationAddress })
    });
  },
  myWithdrawals() {
    return apiRequest<WithdrawalDTO[]>("/withdrawals/my");
  }
};
