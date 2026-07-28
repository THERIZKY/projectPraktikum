import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/rbac.middleware";
import { createUserSchema, updateUserSchema, updateStatusSchema } from "./user.schema";
import { paginationSchema } from "../../lib/pagination";
import * as userService from "./user.service";
import { success, paginated } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";
import type { UserRole } from "@prisma/client";

/**
 * User management routes.
 * Prefix: /api/v1/users
 * All routes require SYSTEM_ADMIN role.
 */
export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .use(adminOnly())

  // ─── GET /users ──────────────────────────────────────────────────────
  .get("/", async ({ query }) => {
    const pagination = paginationSchema.parse(query);
    const filters = {
      role: query.role as UserRole | undefined,
      isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
    };

    const { users, total } = await userService.listUsers(pagination, filters);
    return paginated(users, total, pagination.page, pagination.limit);
  })

  // ─── GET /users/:id ──────────────────────────────────────────────────
  .get("/:id", async ({ params }) => {
    const user = await userService.getUserById(params.id);
    return success(user);
  })

  // ─── POST /users ─────────────────────────────────────────────────────
  .post("/", async ({ body, authUser }) => {
    const dto = createUserSchema.parse(body);
    const user = await userService.createUser(dto);

    auditAction(authUser, "USER_CREATED", "user", user.id, {
      newValues: { email: user.email, role: user.role, fullName: user.fullName },
    });

    return success(user);
  })

  // ─── PUT /users/:id ──────────────────────────────────────────────────
  .put("/:id", async ({ params, body, authUser }) => {
    const dto = updateUserSchema.parse(body);
    const user = await userService.updateUser(params.id, dto);

    auditAction(authUser, "USER_UPDATED", "user", user.id, {
      newValues: dto as Record<string, unknown>,
    });

    return success(user);
  })

  // ─── PATCH /users/:id/status ─────────────────────────────────────────
  .patch("/:id/status", async ({ params, body, authUser }) => {
    const dto = updateStatusSchema.parse(body);
    const user = await userService.updateUserStatus(params.id, dto);

    auditAction(authUser, dto.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", "user", user.id);

    return success(user);
  })

  // ─── DELETE /users/:id ───────────────────────────────────────────────
  .delete("/:id", async ({ params, authUser }) => {
    await userService.deleteUser(params.id);

    auditAction(authUser, "USER_DELETED", "user", params.id);

    return success({ message: "User deactivated successfully" });
  });
