import { create } from "zustand";
import { User, AuthTokens } from "@/types";
import { getStoredTokens, getStoredUser, saveAuthSession, clearAuthSession } from "@/lib/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (tokens: AuthTokens, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (tokens, user) => {
    saveAuthSession(tokens, user);
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  updateUser: (partialUser) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partialUser };
      if (typeof window !== "undefined") {
        localStorage.setItem("pms_user_data", JSON.stringify(updated));
      }
      return { user: updated };
    });
  },

  logout: () => {
    clearAuthSession();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    const tokens = getStoredTokens();
    const user = getStoredUser();
    if (tokens && user) {
      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));
