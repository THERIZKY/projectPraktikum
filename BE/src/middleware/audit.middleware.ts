import { prisma } from "../lib/prisma";
import type { AuthUser } from "../types/common";

/**
 * Audit log service.
 * Provides a simple method to record important actions.
 * Called from other services after successful operations.
 *
 * Audit logs are fire-and-forget — failures are logged but don't
 * affect the original operation.
 */

interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry.
 * This is intentionally async but not awaited by callers (fire-and-forget)
 * to avoid blocking the response.
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues as any,
        newValues: entry.newValues as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    // Log the failure but don't throw — audit logging should never break the app
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Convenience: create audit log with auth user context.
 */
export function auditAction(
  authUser: AuthUser,
  action: string,
  entityType: string,
  entityId?: string,
  options?: {
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
): void {
  // Fire and forget
  createAuditLog({
    userId: authUser.userId,
    action,
    entityType,
    entityId,
    ...options,
  });
}
