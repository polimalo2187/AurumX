import { apiRequest } from "@/api/client";
import type { WalletDTO } from "@/api/types";

export type WalletTransactionDTO = {
  id: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: "USDT";
  status: string;
  createdAt: string;
};

export const walletApi = {
  me() {
    return apiRequest<WalletDTO>("/wallet/me");
  },
  transactions() {
    return apiRequest<{ items: WalletTransactionDTO[]; page: number; totalPages: number }>("/wallet/transactions");
  }
};
