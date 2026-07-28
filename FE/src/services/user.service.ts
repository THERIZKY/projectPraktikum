import { apiClient } from "@/lib/api-client";
import { User, UserRole, ApiResponse, PaginatedResult } from "@/types";

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserPayload {
  username?: string;
  email?: string | null;
  password: string;
  fullName: string;
  nim?: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string | null;
  fullName?: string;
  nim?: string | null;
  phone?: string | null;
  role?: UserRole;
}

export const userService = {
  async listUsers(query: ListUsersQuery = {}): Promise<PaginatedResult<User>> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.role) params.append("role", query.role);
    if (query.isActive !== undefined) params.append("isActive", query.isActive.toString());

    const res = await apiClient.get<unknown, ApiResponse<User[]>>(`/users?${params.toString()}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch users");
    }

    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 20, total: res.data.length, totalPages: 1 },
    };
  },

  async getUserById(id: string): Promise<User> {
    const res = await apiClient.get<unknown, ApiResponse<User>>(`/users/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "User not found");
    }
    return res.data;
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const res = await apiClient.post<unknown, ApiResponse<User>>("/users", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to create user");
    }
    return res.data;
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await apiClient.put<unknown, ApiResponse<User>>(`/users/${id}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to update user");
    }
    return res.data;
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    const res = await apiClient.patch<unknown, ApiResponse<User>>(`/users/${id}/status`, { isActive });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to update user status");
    }
    return res.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
