import Cookies from "js-cookie";
import { User, AuthTokens } from "@/types";

const ACCESS_TOKEN_KEY = "pms_access_token";
const REFRESH_TOKEN_KEY = "pms_refresh_token";
const USER_KEY = "pms_user_data";

export function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = Cookies.get(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(tokens: AuthTokens, user: User) {
  if (typeof window === "undefined") return;
  // Save in Cookies for Next.js Middleware server-side checks
  Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, { expires: 7, path: "/" });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { expires: 7, path: "/" });

  // Save in localStorage for client persistence
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
