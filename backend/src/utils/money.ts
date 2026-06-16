import { Types } from "mongoose";
import { badRequest } from "./errors";

export function toDecimal128(value: number | string): Types.Decimal128 {
  const normalized = typeof value === "number" ? value.toFixed(8) : value;

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw badRequest("Invalid monetary amount", "INVALID_AMOUNT");
  }

  return Types.Decimal128.fromString(normalized);
}

export function decimal128ToNumber(value: Types.Decimal128): number {
  return Number.parseFloat(value.toString());
}

export function roundUSDT(value: number): number {
  return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
}

export function assertPositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw badRequest("Amount must be positive", "INVALID_AMOUNT");
  }
}
