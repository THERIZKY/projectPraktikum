import Elysia from "elysia";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { hashPassword, verifyPassword } from "../../lib/hash";
import { success } from "../../utils/response";
import { ValidationError } from "../../utils/error";
import { auditAction } from "../../middleware/audit.middleware";

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const profileRoutes = new Elysia({ prefix: "/profile" })
  .use(authMiddleware)

  .get("/", async ({ authUser }) => {
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        nim: true,
        phone: true,
        avatarUrl: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return success(user);
  })

  .put("/", async ({ body, authUser }) => {
    const dto = updateProfileSchema.parse(body);
    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data: { fullName: dto.fullName, email: dto.email === null ? null : dto.email, phone: dto.phone },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        nim: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    auditAction(authUser, "PROFILE_UPDATED", "user", authUser.userId);

    return success(user);
  })

  .put("/password", async ({ body, authUser }) => {
    const dto = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { passwordHash: true },
    });

    if (!user) throw new ValidationError("User not found");

    const isValid = await verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new ValidationError("Current password is incorrect");

    const newHash = await hashPassword(dto.newPassword);
    await prisma.user.update({
      where: { id: authUser.userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens on password change
    await prisma.refreshToken.updateMany({
      where: { userId: authUser.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    auditAction(authUser, "PASSWORD_CHANGED", "user", authUser.userId);

    return success({ message: "Password changed. Please log in again." });
  });
