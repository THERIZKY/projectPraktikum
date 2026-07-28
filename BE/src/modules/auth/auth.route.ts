import Elysia from "elysia";
import { loginSchema, refreshSchema, logoutSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import { success } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";

/**
 * Authentication routes.
 * Prefix: /api/v1/auth
 */
export const authRoutes = new Elysia({ prefix: "/auth" })

  // ─── Public Routes ───────────────────────────────────────────────────
  .post("/login", async ({ body, request }) => {
    const dto = loginSchema.parse(body);
    const result = await authService.login(dto);

    // Audit log (fire and forget)
    auditAction(
      { userId: result.user.id, username: result.user.username, role: result.user.role as any, email: result.user.email },
      "USER_LOGIN",
      "user",
      result.user.id,
      { ipAddress: request.headers.get("x-forwarded-for") || undefined }
    );

    return success(result);
  })

  .post("/refresh", async ({ body }) => {
    const dto = refreshSchema.parse(body);
    const result = await authService.refresh(dto);
    return success(result);
  })

  // ─── Authenticated Routes ────────────────────────────────────────────
  .use(authMiddleware)

  .post("/logout", async ({ body }) => {
    const dto = logoutSchema.parse(body);
    await authService.logout(dto.refreshToken);
    return success({ message: "Logged out successfully" });
  })

  .get("/me", async ({ authUser }) => {
    const user = await authService.getMe(authUser.userId);
    return success(user);
  });
