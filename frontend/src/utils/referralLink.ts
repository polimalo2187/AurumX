import { env } from "@/config/env";

function cleanCode(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function safeBaseUrl(value?: string) {
  const fallback = "https://aurumx-production-cdd0.up.railway.app";
  const base = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return base.replace(/\/+$/, "");
}

export function buildReferralLink(referralCode?: string, backendReferralLink?: string) {
  const code = cleanCode(referralCode);

  if (backendReferralLink && backendReferralLink.trim()) {
    return backendReferralLink.trim();
  }

  if (!code) return "";

  return `${safeBaseUrl(env.frontendUrl)}/auth?ref=${encodeURIComponent(code)}`;
}
