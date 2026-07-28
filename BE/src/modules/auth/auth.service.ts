import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "../../lib/jwt";
import { AuthenticationError, NotFoundError, ValidationError } from "../../utils/error";
import type { LoginDto, RefreshDto } from "./auth.schema";
import type { LoginResponse, RefreshResponse } from "./auth.types";

/**
 * Authenticate a user with username and password.
 * Returns user profile and JWT tokens.
 */
export async function login(dto: LoginDto): Promise<LoginResponse> {
  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username: dto.username },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      passwordHash: true,
      role: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  if (!user) {
    // Generic message to prevent user enumeration
    throw new AuthenticationError("Invalid username or password");
  }

  if (!user.isActive) {
    throw new AuthenticationError("Your account has been deactivated. Contact your administrator.");
  }

  // Verify password
  const isValidPassword = await verifyPassword(dto.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthenticationError("Invalid username or password");
  }

  // Generate tokens
  const accessToken = await generateAccessToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
  });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = await hashRefreshToken(refreshToken);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

/**
 * Refresh an access token using a valid refresh token.
 * Implements token rotation: old refresh token is revoked, new one is issued.
 */
export async function refresh(dto: RefreshDto): Promise<RefreshResponse> {
  const tokenHash = await hashRefreshToken(dto.refreshToken);

  // Find the refresh token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthenticationError("Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    throw new AuthenticationError("Refresh token has been revoked");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AuthenticationError("Refresh token has expired");
  }

  if (!storedToken.user.isActive) {
    throw new AuthenticationError("Your account has been deactivated");
  }

  // Revoke old refresh token (rotation)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new tokens
  const accessToken = await generateAccessToken({
    userId: storedToken.user.id,
    username: storedToken.user.username,
    role: storedToken.user.role,
    email: storedToken.user.email,
  });

  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout by revoking the refresh token.
 */
export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = await hashRefreshToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash: tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all refresh tokens for a user.
 * Called when password is changed or user is deactivated.
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Get the current user's profile from the database.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      nim: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User");
  }

  return user;
}
