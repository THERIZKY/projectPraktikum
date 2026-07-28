import * as jose from "jose";
import { env } from "../config/env";
import { parseDuration } from "../utils/helpers";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "./hash";

// Encode secrets as Uint8Array for jose
const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface AccessTokenPayload {
  userId: string;
  username: string;
  role: string;
  email?: string | null;
}

/**
 * Generate a JWT access token.
 * Contains userId, username, role, email — used for authentication and route-level RBAC.
 */
export async function generateAccessToken(payload: AccessTokenPayload): Promise<string> {
  const expiryMs = parseDuration(env.JWT_ACCESS_EXPIRY);
  const expirySeconds = Math.floor(expiryMs / 1000);

  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expirySeconds}s`)
    .sign(accessSecret);
}

/**
 * Verify and decode a JWT access token.
 * Throws if expired or invalid.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jose.jwtVerify(token, accessSecret);
  return {
    userId: payload.userId as string,
    username: payload.username as string,
    role: payload.role as string,
    email: payload.email as string | undefined,
  };
}

/**
 * Generate a random refresh token string.
 * This is NOT a JWT — it's a random opaque string stored hashed in the database.
 */
export function generateRefreshToken(): string {
  return nanoid(64);
}

/**
 * Hash a refresh token before storing in database.
 * Uses SHA-256 (not bcrypt — we need fast comparison for token lookup).
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get the expiry date for a new refresh token.
 */
export function getRefreshTokenExpiry(): Date {
  const expiryMs = parseDuration(env.JWT_REFRESH_EXPIRY);
  return new Date(Date.now() + expiryMs);
}
