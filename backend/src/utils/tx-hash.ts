import { badRequest } from "./errors";

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export function normalizeTxHash(txHash: string): string {
  const normalized = txHash.trim().toLowerCase();

  if (!TX_HASH_REGEX.test(normalized)) {
    throw badRequest("Invalid transaction hash", "INVALID_TX_HASH");
  }

  return normalized;
}

export function isValidTxHash(txHash: string): boolean {
  return TX_HASH_REGEX.test(txHash.trim());
}
