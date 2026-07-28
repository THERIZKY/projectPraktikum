import { apiClient } from "@/lib/api-client";
import { AnnouncementPriority, ApiResponse, PaginatedResult } from "@/types";

export interface Announcement {
  id: string;
  laboratoryId: string;
  practicumId: string | null;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedBy: string;
  publishedAt: string;
  isPinned: boolean;
  publisher?: { fullName: string };
  practicum?: { name: string; code: string };
  laboratory?: { name: string };
}

export interface CreateAnnouncementPayload {
  laboratoryId: string;
  practicumId?: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
}

export const announcementService = {
  async listAnnouncements(page = 1, limit = 10): Promise<PaginatedResult<Announcement>> {
    const res = await apiClient.get<unknown, ApiResponse<Announcement[]>>(`/announcements?page=${page}&limit=${limit}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch announcements");
    }
    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 10, total: res.data.length, totalPages: 1 },
    };
  },

  async createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
    const res = await apiClient.post<unknown, ApiResponse<Announcement>>("/announcements", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to post announcement");
    }
    return res.data;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await apiClient.delete(`/announcements/${id}`);
  },
};
