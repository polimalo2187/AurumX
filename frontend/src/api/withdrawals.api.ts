import { apiRequest } from "@/api/client";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type WithdrawalDTO = {
  id?: string;
  _id?: string;
  amount: number;
  currency: "USDT" | string;
  network: "BEP20" | "BSC" | string;
  tokenStandard?: "BEP20" | string;
  destinationAddress: string;
  status: WithdrawalStatus;
  adminTxHash?: string | null;
  adminNote?: string;
  requestedAt: string;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WithdrawalsPageDTO = {
  items: WithdrawalDTO[];
  page: number;
  total: number;
  totalPages: number;
};

export const withdrawalsApi = {
  request(amount: number, destinationAddress: string) {
    return apiRequest<WithdrawalDTO>("/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount, network: "BEP20", destinationAddress })
    });
  },
  myWithdrawals() {
    return apiRequest<WithdrawalsPageDTO>("/withdrawals/my");
  }
};
