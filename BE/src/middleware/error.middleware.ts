import Elysia from "elysia";
import { AppError } from "../utils/error";
import { error as errorResponse } from "../utils/response";
import { env } from "../config/env";

/**
 * Global error handler middleware.
 * Catches all errors thrown during request processing and formats them
 * into a consistent API error response.
 */
export const errorMiddleware = new Elysia({ name: "error-middleware" })
  .onError({ as: "global" }, ({ error, set }) => {
    const err = (error as any)?.cause || (error as any)?.error || error;

    // Known application errors
    if (err instanceof AppError) {
      set.status = err.statusCode as any;
      return errorResponse(err.code, err.message, err.details);
    }

    // Zod validation errors
    if (
      err &&
      typeof err === "object" &&
      ("issues" in err || err.name === "ZodError" || err.constructor?.name === "ZodError")
    ) {
      set.status = 400;
      const issues = err.issues || [];
      const firstMsg = issues[0]?.message || "Validation failed";
      return errorResponse("VALIDATION_ERROR", firstMsg, issues);
    }

    // Elysia validation errors (from t.Object schemas)
    if (err && typeof err === "object" && "type" in err) {
      if (err.type === "validation") {
        set.status = 400;
        return errorResponse("VALIDATION_ERROR", "Invalid request data", err.all);
      }
    }

    // Elysia 404 Not Found
    if (
      (error as any)?.code === "NOT_FOUND" ||
      (error as any)?.status === 404 ||
      (error as Error)?.message === "NOT_FOUND"
    ) {
      set.status = 404;
      return errorResponse("NOT_FOUND", "The requested API endpoint was not found.");
    }

    // Unknown errors — log and return generic 500
    if (env.NODE_ENV === "development") {
      console.error("Unhandled error:", error);
    }

    set.status = 500;
    return errorResponse(
      "INTERNAL_ERROR",
      env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : (error as Error)?.message || "Unknown error"
    );
  });
