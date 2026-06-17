export function formatUSDT(value: number | undefined | null): string {
  const safe = Number.isFinite(value) ? Number(value) : 0;
  return `${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} USDT`;
}
