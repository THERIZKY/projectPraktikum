import Elysia from "elysia";
import { UserRole } from "@prisma/client";
import { ForbiddenError } from "../utils/error";
import type { AuthUser } from "../types/common";

/**
 * Role-Based Access Control middleware factory.
 * Returns an Elysia plugin that checks if the authenticated user has one of
 * the allowed roles. Must be applied AFTER authMiddleware.
 *
 * Usage:
 *   app
 *     .use(authMiddleware)
 *     .use(requireRoles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN))
 *     .get("/admin-only", handler)
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return new Elysia({ name: `rbac-${allowedRoles.join("-")}` })
    .onBeforeHandle((ctx: any) => {
      const authUser: AuthUser | undefined = ctx.authUser;

      if (!authUser) {
        throw new ForbiddenError("Authentication required");
      }

      if (!allowedRoles.includes(authUser.role)) {
        throw new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(", ")}`
        );
      }
    });
}

/**
 * Convenience role guards for common permission patterns.
 */
export const adminOnly = () => requireRoles(UserRole.SYSTEM_ADMIN);
export const labAdminOrAbove = () => requireRoles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN);
export const assistantOrAbove = () =>
  requireRoles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN, UserRole.ASSISTANT);
export const authenticated = () =>
  requireRoles(UserRole.SYSTEM_ADMIN, UserRole.LAB_ADMIN, UserRole.ASSISTANT, UserRole.STUDENT);
