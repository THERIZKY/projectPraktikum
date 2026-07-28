/**
 * Custom error classes for consistent API error handling.
 * Each error maps to a specific HTTP status code.
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** 400 — Invalid input or failed validation */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

/** 401 — Missing or invalid authentication */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "AUTHENTICATION_ERROR", message);
    this.name = "AuthenticationError";
  }
}

/** 403 — Authenticated but insufficient permissions */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

/** 404 — Resource not found */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(404, "NOT_FOUND", msg);
    this.name = "NotFoundError";
  }
}

/** 409 — Conflicting operation (e.g., duplicate email) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

/** 413 — File or payload too large */
export class FileTooLargeError extends AppError {
  constructor(maxSizeMb: number) {
    super(413, "FILE_TOO_LARGE", `File exceeds maximum size of ${maxSizeMb}MB`);
    this.name = "FileTooLargeError";
  }
}
