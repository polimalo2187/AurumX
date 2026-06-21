import { apiRequest } from "@/api/client";

export type AdminPage<T = Record<string, unknown>> = {
  items: T[];
  page: number;
  total: number;
  totalPages: number;
};

function queryString(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const adminApi = {
  dashboard() {
    return apiRequest<Record<string, unknown>>("/admin/dashboard");
  },
  users(params?: { page?: number; limit?: number; status?: string; role?: string; riskFlagged?: boolean; search?: string }) {
    return apiRequest<AdminPage>("/admin/users" + queryString(params));
  },
  user(id: string) {
    return apiRequest<Record<string, unknown>>(`/admin/users/${id}`);
  },
  blockUser(id: string, reason: string) {
    return apiRequest<Record<string, unknown>>(`/admin/users/${id}/block`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  },
  unblockUser(id: string) {
    return apiRequest<Record<string, unknown>>(`/admin/users/${id}/unblock`, {
      method: "POST"
    });
  },
  deposits(params?: { page?: number; limit?: number; status?: string; userId?: string }) {
    return apiRequest<AdminPage>("/admin/deposits" + queryString(params));
  },
  retryDeposit(id: string) {
    return apiRequest<Record<string, unknown>>(`/admin/deposits/${id}/retry-verification`, {
      method: "POST"
    });
  },
  rejectDeposit(id: string, reason: string) {
    return apiRequest<Record<string, unknown>>(`/admin/deposits/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  },
  withdrawals(params?: { page?: number; limit?: number }) {
    return apiRequest<AdminPage>("/admin/withdrawals/pending" + queryString(params));
  },
  approveWithdrawal(id: string, adminTxHash: string, adminNote?: string) {
    return apiRequest<Record<string, unknown>>(`/admin/withdrawals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ adminTxHash, adminNote })
    });
  },
  rejectWithdrawal(id: string, adminNote: string) {
    return apiRequest<Record<string, unknown>>(`/admin/withdrawals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ adminNote })
    });
  },
  riskSummary() {
    return apiRequest<Record<string, unknown>>("/admin/risk/summary");
  },
  riskFlags(params?: { page?: number; limit?: number; status?: string; severity?: string; type?: string; userId?: string }) {
    return apiRequest<AdminPage>("/admin/risk/flags" + queryString(params));
  },
  resolveRiskFlag(id: string, note: string) {
    return apiRequest<Record<string, unknown>>(`/admin/risk/flags/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
  },
  ignoreRiskFlag(id: string, note: string) {
    return apiRequest<Record<string, unknown>>(`/admin/risk/flags/${id}/ignore`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
  },
  auditLogs(params?: { page?: number; limit?: number; action?: string; targetType?: string }) {
    return apiRequest<AdminPage>("/admin/audit-logs" + queryString(params));
  }
};
