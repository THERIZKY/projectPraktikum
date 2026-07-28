/**
 * Standardized API response helpers.
 * Every API response follows the same structure for consistency.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Create a success response */
export function success<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, meta };
}

/** Create a paginated success response */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Create an error response */
export function error(code: string, message: string, details?: unknown): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
  };
}
