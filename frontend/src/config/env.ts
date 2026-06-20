type RuntimeAurumXEnv = {
  VITE_API_BASE_URL?: string;
  VITE_APP_NAME?: string;
  VITE_TELEGRAM_BOT_USERNAME?: string;
};

declare global {
  interface Window {
    __AURUMX_ENV__?: RuntimeAurumXEnv;
  }
}

function readRuntimeEnv(): RuntimeAurumXEnv {
  if (typeof window === "undefined") return {};
  return window.__AURUMX_ENV__ || {};
}

function cleanValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function defaultApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".up.railway.app")) {
    return "https://aurumx-production.up.railway.app/api";
  }

  return "http://localhost:8080/api";
}

const runtimeEnv = readRuntimeEnv();

const apiBaseUrl = stripTrailingSlash(
  cleanValue(runtimeEnv.VITE_API_BASE_URL) ||
    cleanValue(import.meta.env.VITE_API_BASE_URL) ||
    defaultApiBaseUrl()
);

export const env = {
  apiBaseUrl,
  appName: cleanValue(runtimeEnv.VITE_APP_NAME) || cleanValue(import.meta.env.VITE_APP_NAME) || "AurumX",
  telegramBotUsername:
    cleanValue(runtimeEnv.VITE_TELEGRAM_BOT_USERNAME) || cleanValue(import.meta.env.VITE_TELEGRAM_BOT_USERNAME) || ""
} as const;
