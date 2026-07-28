import Elysia from "elysia";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove } from "../../middleware/rbac.middleware";
import { paginationSchema, getPrismaPageArgs } from "../../lib/pagination";
import { success, paginated } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";
import { NotFoundError } from "../../utils/error";
import type { Prisma, AnnouncementPriority } from "@prisma/client";

const createSchema = z.object({
  laboratoryId: z.string().uuid(),
  practicumId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  isPinned: z.boolean().default(false),
});

const updateSchema = createSchema.partial().omit({ laboratoryId: true });

export const announcementRoutes = new Elysia({ prefix: "/announcements" })
  .use(authMiddleware)

  .get("/", async ({ query, authUser }) => {
    const pagination = paginationSchema.parse(query);
    const where: Prisma.AnnouncementWhereInput = {};

    // Scope by role
    if (authUser.role === "LAB_ADMIN") {
      const lab = await prisma.laboratory.findFirst({
        where: { adminId: authUser.userId }, select: { id: true },
      });
      if (lab) where.laboratoryId = lab.id;
    } else if (authUser.role === "ASSISTANT" || authUser.role === "STUDENT") {
      // Get practicums the user is involved in
      const enrollmentFilter = authUser.role === "STUDENT"
        ? { studentEnrollments: { some: { studentId: authUser.userId, status: "ACTIVE" as const } } }
        : { assistantAssignments: { some: { assistantId: authUser.userId } } };

      const classes = await prisma.practicumClass.findMany({
        where: enrollmentFilter,
        select: { practicum: { select: { id: true, laboratoryId: true } } },
      });

      const labIds = [...new Set(classes.map((c) => c.practicum.laboratoryId))];
      const practicumIds = classes.map((c) => c.practicum.id);

      where.OR = [
        { laboratoryId: { in: labIds }, practicumId: null }, // Lab-wide
        { practicumId: { in: practicumIds } }, // Practicum-specific
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          publisher: { select: { fullName: true } },
          practicum: { select: { name: true, code: true } },
          laboratory: { select: { name: true } },
        },
        ...getPrismaPageArgs(pagination),
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      }),
      prisma.announcement.count({ where }),
    ]);

    return paginated(announcements, total, pagination.page, pagination.limit);
  })

  .get("/:id", async ({ params }) => {
    const ann = await prisma.announcement.findUnique({
      where: { id: params.id },
      include: {
        publisher: { select: { fullName: true } },
        practicum: { select: { name: true } },
        laboratory: { select: { name: true } },
      },
    });
    if (!ann) throw new NotFoundError("Announcement", params.id);
    return success(ann);
  })

  .post("/", async ({ body, authUser }) => {
    const dto = createSchema.parse(body);
    const ann = await prisma.announcement.create({
      data: {
        ...dto,
        priority: dto.priority as AnnouncementPriority,
        publishedBy: authUser.userId,
      },
    });

    auditAction(authUser, "ANNOUNCEMENT_CREATED", "announcement", ann.id);

    // Create notifications for relevant users (fire and forget)
    createAnnouncementNotifications(ann.id, dto.laboratoryId, dto.practicumId);

    return success(ann);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .put("/:id", async ({ params, body, authUser }) => {
    const dto = updateSchema.parse(body);
    const ann = await prisma.announcement.update({
      where: { id: params.id },
      data: {
        title: dto.title,
        content: dto.content,
        priority: dto.priority as AnnouncementPriority | undefined,
        isPinned: dto.isPinned,
      },
    });
    auditAction(authUser, "ANNOUNCEMENT_UPDATED", "announcement", params.id);
    return success(ann);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .delete("/:id", async ({ params, authUser }) => {
    await prisma.announcement.delete({ where: { id: params.id } });
    auditAction(authUser, "ANNOUNCEMENT_DELETED", "announcement", params.id);
    return success({ message: "Announcement deleted" });
  }, { beforeHandle: [labAdminOrAbove() as any] });

/**
 * Create notifications for users related to the announcement.
 * This is fire-and-forget to not block the response.
 */
async function createAnnouncementNotifications(
  announcementId: string,
  laboratoryId: string,
  practicumId?: string
) {
  try {
    // Find all relevant students and assistants
    const whereClass: Prisma.PracticumClassWhereInput = practicumId
      ? { practicum: { id: practicumId } }
      : { practicum: { laboratoryId } };

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { practicumClass: whereClass, status: "ACTIVE" },
      select: { studentId: true },
    });

    const assignments = await prisma.assistantAssignment.findMany({
      where: { practicumClass: whereClass },
      select: { assistantId: true },
    });

    const userIds = [
      ...new Set([
        ...enrollments.map((e) => e.studentId),
        ...assignments.map((a) => a.assistantId),
      ]),
    ];

    if (userIds.length > 0) {
      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          title: "New Announcement",
          message: "A new announcement has been posted.",
          type: "ANNOUNCEMENT" as const,
          referenceType: "announcement",
          referenceId: announcementId,
        })),
      });
    }
  } catch (err) {
    console.error("Failed to create announcement notifications:", err);
  }
}
