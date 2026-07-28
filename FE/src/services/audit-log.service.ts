import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResult } from "@/types";

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user?: { fullName: string; email: string | null; role: string };
}

export const auditLogService = {
  async listAuditLogs(page = 1, limit = 20): Promise<PaginatedResult<AuditLogItem>> {
    const res = await apiClient.get<unknown, ApiResponse<AuditLogItem[]>>(`/audit-logs?page=${page}&limit=${limit}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch audit logs");
    }
    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 20, total: res.data.length, totalPages: 1 },
    };
  },
};
