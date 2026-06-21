import { apiRequest } from "@/api/client";
import type { AuthResponse, RegisterResponse, TelegramStartResponse } from "@/api/types";

export type RegisterPayload = {
  username: string;
  countryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export const authApi = {
  register(payload: RegisterPayload) {
    return apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });
  },
  completeRegistration(verificationToken: string) {
    return apiRequest<AuthResponse>("/auth/register/complete", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ verificationToken })
    });
  },
  login(payload: LoginPayload) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload)
    });
  },
  startTelegramLogin(referralCode?: string) {
    return apiRequest<TelegramStartResponse>("/auth/telegram/start", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ referralCode })
    });
  },
  completeTelegramLogin(verificationToken: string) {
    return apiRequest<AuthResponse>("/auth/telegram/complete", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ verificationToken })
    });
  }
};
