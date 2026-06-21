import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SEPARATOR = ":";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}${SEPARATOR}${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(SEPARATOR);

  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const original = Buffer.from(hash, "hex");

  if (candidate.length !== original.length) return false;

  return timingSafeEqual(candidate, original);
}
