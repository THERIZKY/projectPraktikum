import { apiClient } from "@/lib/api-client";
import { Semester, ApiResponse, PaginatedResult } from "@/types";

export interface Practicum {
  id: string;
  laboratoryId: string;
  name: string;
  code: string;
  description: string | null;
  academicYear: string;
  semester: Semester;
  totalSessions: number;
  isActive: boolean;
  laboratory?: { id: string; name: string; code: string };
  _count?: { classes: number; gradingComponents: number; assignments: number };
  createdAt: string;
}

export interface CreatePracticumPayload {
  laboratoryId: string;
  name: string;
  code: string;
  description?: string;
  academicYear: string;
  semester: Semester;
  totalSessions: number;
}

export interface UpdatePracticumPayload {
  name?: string;
  code?: string;
  description?: string;
  academicYear?: string;
  semester?: Semester;
  totalSessions?: number;
}

export const practicumService = {
  async listPracticums(academicYear?: string, semester?: Semester): Promise<PaginatedResult<Practicum>> {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (semester) params.append("semester", semester);

    const res = await apiClient.get<unknown, ApiResponse<Practicum[]>>(`/practicums?${params.toString()}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch practicums");
    }
    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 50, total: res.data.length, totalPages: 1 },
    };
  },

  async getPracticumById(id: string): Promise<Practicum> {
    const res = await apiClient.get<unknown, ApiResponse<Practicum>>(`/practicums/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Practicum not found");
    }
    return res.data;
  },

  async createPracticum(payload: CreatePracticumPayload): Promise<Practicum> {
    const res = await apiClient.post<unknown, ApiResponse<Practicum>>("/practicums", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to create practicum");
    }
    return res.data;
  },

  async updatePracticum(id: string, payload: UpdatePracticumPayload): Promise<Practicum> {
    const res = await apiClient.put<unknown, ApiResponse<Practicum>>(`/practicums/${id}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to update practicum");
    }
    return res.data;
  },

  async deletePracticum(id: string): Promise<void> {
    await apiClient.delete(`/practicums/${id}`);
  },
};
