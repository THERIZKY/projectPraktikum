import { UserRole } from "@prisma/client";

/**
 * Shared TypeScript types used across modules.
 */

/** The authenticated user context attached to each request */
export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
  email?: string | null;
}

/** Standard API response shape */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** DTO for creating things — commonly used by route schemas */
export interface IdParam {
  id: string;
}
