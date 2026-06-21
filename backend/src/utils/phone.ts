export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function normalizeCountryCode(countryCode: string): string {
  const digits = onlyDigits(countryCode);
  return digits ? `+${digits}` : "";
}

export function normalizePhoneE164(countryCode: string, phoneNumber: string): string {
  const code = normalizeCountryCode(countryCode);
  const phone = onlyDigits(phoneNumber);

  if (!code || !phone) return "";

  return `${code}${phone}`;
}

export function normalizeTelegramPhone(phoneNumber: string): string {
  const digits = onlyDigits(phoneNumber);
  return digits ? `+${digits}` : "";
}

export function phoneMatches(expectedE164: string, telegramPhone: string): boolean {
  const expected = normalizeTelegramPhone(expectedE164);
  const received = normalizeTelegramPhone(telegramPhone);
  return Boolean(expected && received && expected === received);
}
