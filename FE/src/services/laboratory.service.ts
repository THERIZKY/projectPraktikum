import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedResult } from "@/types";

export interface Laboratory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  adminId: string | null;
  isActive: boolean;
  admin?: { id: string; fullName: string; username: string } | null;
  _count?: { practicums: number };
  createdAt: string;
}

export interface CreateLabPayload {
  name: string;
  code: string;
  description?: string;
  adminId?: string;
}

export interface UpdateLabPayload {
  name?: string;
  code?: string;
  description?: string;
}

export const laboratoryService = {
  async listLaboratories(page = 1, limit = 10): Promise<PaginatedResult<Laboratory>> {
    const res = await apiClient.get<unknown, ApiResponse<Laboratory[]>>(`/laboratories?page=${page}&limit=${limit}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch laboratories");
    }
    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 10, total: res.data.length, totalPages: 1 },
    };
  },

  async createLab(payload: CreateLabPayload): Promise<Laboratory> {
    const res = await apiClient.post<unknown, ApiResponse<Laboratory>>("/laboratories", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to create laboratory");
    }
    return res.data;
  },

  async updateLab(id: string, payload: UpdateLabPayload): Promise<Laboratory> {
    const res = await apiClient.put<unknown, ApiResponse<Laboratory>>(`/laboratories/${id}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to update laboratory");
    }
    return res.data;
  },

  async assignAdmin(id: string, adminId: string): Promise<Laboratory> {
    const res = await apiClient.patch<unknown, ApiResponse<Laboratory>>(`/laboratories/${id}/admin`, { adminId });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to assign lab admin");
    }
    return res.data;
  },

  async deleteLab(id: string): Promise<void> {
    await apiClient.delete(`/laboratories/${id}`);
  },
};
