import { z } from "zod";

/** Login request schema */
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/** Token refresh request schema */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/** Logout request schema */
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/** Forgot password request schema */
export const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

/** Reset password request schema */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
