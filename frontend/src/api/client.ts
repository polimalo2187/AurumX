import { env } from "@/config/env";

export type ApiErrorPayload = {
  success?: false;
  code?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || "Error de API");
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const TOKEN_KEY = "aurumx_token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload || { message: response.statusText });
  }

  return payload as T;
}
