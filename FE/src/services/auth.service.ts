import { apiClient } from "@/lib/api-client";
import { User, AuthTokens, ApiResponse } from "@/types";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginData {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginData> {
    const res = await apiClient.post<unknown, ApiResponse<LoginData>>("/auth/login", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Login failed");
    }
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<unknown, ApiResponse<User>>("/auth/me");
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch user profile");
    }
    return res.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post("/auth/logout", { refreshToken });
  },
};
