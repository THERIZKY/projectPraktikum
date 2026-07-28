import Elysia from "elysia";
import { verifyAccessToken } from "../lib/jwt";
import { AuthenticationError } from "../utils/error";
import type { AuthUser } from "../types/common";

/**
 * Authentication middleware.
 * Extracts and verifies the JWT access token from the Authorization header.
 * Attaches the decoded user to the request context as `authUser`.
 *
 * Usage: Apply to route groups that require authentication.
 *   app.use(authMiddleware).get("/protected", (ctx) => ctx.store.authUser)
 */
export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .derive({ as: "scoped" }, async ({ headers }): Promise<{ authUser: AuthUser }> => {
    const authHeader = headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    try {
      const payload = await verifyAccessToken(token);
      return {
        authUser: {
          userId: payload.userId,
          username: payload.username,
          role: payload.role as AuthUser["role"],
          email: payload.email,
        },
      };
    } catch (err) {
      throw new AuthenticationError("Invalid or expired access token");
    }
  });
