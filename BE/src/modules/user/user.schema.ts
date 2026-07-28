import { z } from "zod";
import { UserRole } from "@prisma/client";

/** Create user request schema */
export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50).optional(),
  email: z.string().email("Invalid email format").optional().nullable(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(1, "Full name is required").max(255),
  nim: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  role: z.nativeEnum(UserRole),
});

/** Update user request schema */
export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().nullable().optional(),
  fullName: z.string().min(1).max(255).optional(),
  nim: z.string().max(20).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

/** Update user status (activate/deactivate) */
export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
