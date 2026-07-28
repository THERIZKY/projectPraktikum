import { apiClient } from "@/lib/api-client";
import { NotificationType, ApiResponse, PaginatedResult } from "@/types";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export const notificationService = {
  async listNotifications(page = 1, limit = 20): Promise<PaginatedResult<NotificationItem>> {
    const res = await apiClient.get<unknown, ApiResponse<NotificationItem[]>>(`/notifications?page=${page}&limit=${limit}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch notifications");
    }
    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 20, total: res.data.length, totalPages: 1 },
    };
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },
};
