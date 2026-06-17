import { apiRequest } from "@/api/client";

export const adminApi = {
  dashboard() {
    return apiRequest<Record<string, unknown>>("/admin/dashboard");
  },
  users() {
    return apiRequest<Record<string, unknown>[]>("/admin/users");
  },
  user(id: string) {
    return apiRequest<Record<string, unknown>>(`/admin/users/${id}`);
  },
  deposits() {
    return apiRequest<Record<string, unknown>[]>("/admin/deposits");
  },
  withdrawals() {
    return apiRequest<Record<string, unknown>[]>("/admin/withdrawals/pending");
  },
  riskSummary() {
    return apiRequest<Record<string, unknown>>("/admin/risk/summary");
  },
  auditLogs() {
    return apiRequest<Record<string, unknown>[]>("/admin/audit-logs");
  }
};
