import { apiRequest } from "@/api/client";
import type { AuthResponse, TelegramStartResponse } from "@/api/types";

export const authApi = {
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
