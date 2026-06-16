import { getAddress, isAddress } from "ethers";
import { badRequest } from "./errors";

export function normalizeBscAddress(address: string): string {
  const trimmed = address.trim();

  if (!isAddress(trimmed)) {
    throw badRequest("Invalid BSC address", "INVALID_BSC_ADDRESS");
  }

  return getAddress(trimmed).toLowerCase();
}

export function sameBscAddress(a: string, b: string): boolean {
  return normalizeBscAddress(a) === normalizeBscAddress(b);
}
