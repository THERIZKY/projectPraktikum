import { apiClient } from "@/lib/api-client";
import { User, ApiResponse } from "@/types";

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get<unknown, ApiResponse<User>>("/profile");
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch profile");
    }
    return res.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await apiClient.put<unknown, ApiResponse<User>>("/profile", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to update profile");
    }
    return res.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    const res = await apiClient.put<unknown, ApiResponse<{ message: string }>>("/profile/password", payload);
    if (!res.success) {
      throw new Error(res.error?.message || "Failed to change password");
    }
  },
};
