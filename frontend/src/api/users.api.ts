import { apiRequest } from "@/api/client";
import type { DashboardDTO, UserDTO } from "@/api/types";

export const usersApi = {
  me() {
    return apiRequest<UserDTO>("/users/me");
  },
  dashboard() {
    return apiRequest<DashboardDTO>("/users/me/dashboard");
  }
};
