export function textValue(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.username,
      record.telegramUsername,
      record.firstName,
      record.phoneNumber,
      record.referralCode,
      record.name,
      record.slug,
      record.id,
      record._id
    ];

    const found = candidates.find((item) => typeof item === "string" && item.trim());
    if (found) return String(found);
  }

  return fallback;
}

export function idValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.id || record._id || "");
  }
  return "";
}

export function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function itemsFromPage<T = Record<string, unknown>>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

export function totalFromPage(value: unknown): number {
  if (value && typeof value === "object") {
    const total = (value as { total?: unknown }).total;
    if (typeof total === "number") return total;
  }
  return itemsFromPage(value).length;
}

export function pageCountFromPage(value: unknown): number {
  if (value && typeof value === "object") {
    const totalPages = (value as { totalPages?: unknown }).totalPages;
    if (typeof totalPages === "number") return totalPages;
  }
  return 1;
}

export function statusTone(status?: string): "gold" | "green" | "red" | "muted" {
  if (!status) return "muted";
  if (["ACTIVE", "APPROVED", "CONFIRMED", "RESOLVED", "COMPLETED"].includes(status)) return "green";
  if (["PENDING", "VERIFYING", "HASH_SUBMITTED", "NEEDS_REVIEW", "OPEN", "HIGH", "CRITICAL"].includes(status)) return "gold";
  if (["BLOCKED", "REJECTED", "CANCELLED", "EXPIRED", "IGNORED"].includes(status)) return "red";
  return "muted";
}

export function shortHash(value?: string | null): string {
  if (!value) return "—";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
