import { apiRequest } from "@/api/client";

export type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
};

export const notificationsApi = {
  list() {
    return apiRequest<NotificationDTO[]>("/notifications");
  }
};
