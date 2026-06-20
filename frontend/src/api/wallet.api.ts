import { apiRequest } from "@/api/client";
import type { WalletDTO } from "@/api/types";

export type WalletTransactionDTO = {
  id?: string;
  _id?: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: "USDT" | string;
  status: string;
  referenceType?: string;
  referenceId?: string | null;
  balanceBefore?: number;
  balanceAfter?: number;
  metadata?: unknown;
  createdAt: string;
  updatedAt?: string;
};

export type WalletTransactionsPageDTO = {
  items: WalletTransactionDTO[];
  page: number;
  total: number;
  totalPages: number;
};

export const walletApi = {
  me() {
    return apiRequest<WalletDTO>("/wallet/me");
  },
  transactions() {
    return apiRequest<WalletTransactionsPageDTO>("/wallet/transactions");
  }
};
