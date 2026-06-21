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

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  details?: unknown;
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

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return Boolean(payload && typeof payload === "object" && "success" in payload);
}

function unwrapPayload<T>(payload: unknown): T {
  if (isApiEnvelope<T>(payload)) {
    if (payload.success === false) {
      throw new ApiError(400, {
        success: false,
        code: payload.code,
        message: payload.message || "Error de API",
        details: payload.details
      });
    }

    if ("data" in payload) {
      return payload.data as T;
    }
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      headers,
      mode: "cors",
      credentials: "omit"
    });
  } catch (error) {
    throw new ApiError(0, {
      success: false,
      code: "NETWORK_ERROR",
      message: `No se pudo conectar con el backend (${env.apiBaseUrl}). Revisa VITE_API_BASE_URL o CORS_ORIGINS.`,
      details: error instanceof Error ? error.message : error
    });
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const fallbackMessage = response.status === 404
      ? "Ruta de API no encontrada. Revisa que el backend esté actualizado y desplegado."
      : response.status >= 500
        ? "El backend devolvió un error interno. Revisa los logs del servicio backend."
        : response.statusText || "Error de API";

    throw new ApiError(response.status, payload || { message: fallbackMessage });
  }

  return unwrapPayload<T>(payload);
}
