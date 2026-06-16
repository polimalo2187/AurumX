export type DepositVerificationStatus =
  | "CONFIRMED"
  | "PENDING_CONFIRMATIONS"
  | "FAILED"
  | "TX_NOT_FOUND"
  | "WRONG_TOKEN"
  | "WRONG_RECEIVER"
  | "INSUFFICIENT_AMOUNT"
  | "UNKNOWN_ERROR";

export type DepositVerificationInput = {
  txHash: string;
  expectedReceiver: string;
  expectedAmountUSDT: number;
};

export type DepositVerificationResult = {
  valid: boolean;
  status: DepositVerificationStatus;
  txHash: string;
  fromAddress?: string;
  toAddress?: string;
  tokenContract?: string;
  amountUSDT?: number;
  confirmations?: number;
  blockNumber?: number;
  reason?: string;
};

export interface BlockchainDepositVerifier {
  verifyBep20UsdtDeposit(input: DepositVerificationInput): Promise<DepositVerificationResult>;
}
