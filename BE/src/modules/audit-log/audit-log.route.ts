import Elysia from "elysia";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly, labAdminOrAbove } from "../../middleware/rbac.middleware";
import { paginationSchema, getPrismaPageArgs } from "../../lib/pagination";
import { success, paginated } from "../../utils/response";
import type { Prisma } from "@prisma/client";

export const auditLogRoutes = new Elysia({ prefix: "/audit-logs" })
  .use(authMiddleware)
  .use(labAdminOrAbove())

  .get("/", async ({ query, authUser }) => {
    const pagination = paginationSchema.parse(query);
    const where: Prisma.AuditLogWhereInput = {};

    // Lab Admin: scope to their lab's actions
    if (authUser.role === "LAB_ADMIN") {
      const lab = await prisma.laboratory.findFirst({
        where: { adminId: authUser.userId },
        select: { id: true },
      });

      if (lab) {
        // Get user IDs within their lab scope
        const labPracticums = await prisma.practicum.findMany({
          where: { laboratoryId: lab.id },
          select: { id: true },
        });
        const practicumIds = labPracticums.map((p) => p.id);

        where.OR = [
          { entityType: "practicum", entityId: { in: practicumIds } },
          { entityType: "laboratory", entityId: lab.id },
          { entityType: { in: ["grade", "submission", "assignment", "session", "attendance", "announcement"] } },
        ];
      }
    }

    // Optional filters
    if (query.action) where.action = query.action as string;
    if (query.entityType) where.entityType = query.entityType as string;
    if (query.userId) where.userId = query.userId as string;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
        ...getPrismaPageArgs(pagination),
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginated(logs, total, pagination.page, pagination.limit);
  })

  .get("/:id", async ({ params }) => {
    const log = await prisma.auditLog.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
    return success(log);
  });
