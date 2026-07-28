export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string | null;
    fullName: string;
    role: string;
    avatarUrl: string | null;
  };
  tokens: AuthTokens;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string; // Only included if token was rotated
}
