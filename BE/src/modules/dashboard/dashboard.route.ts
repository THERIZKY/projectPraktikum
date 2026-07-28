import Elysia from "elysia";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { success } from "../../utils/response";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(authMiddleware)

  // ─── System Admin Dashboard ─────────────────────────────────────────
  .get("/system", async ({ authUser }) => {
    if (authUser.role !== "SYSTEM_ADMIN") {
      return success(null);
    }

    const [totalUsers, totalLabs, totalPracticums, totalStudents, totalAssistants, recentLogs] =
      await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.laboratory.count({ where: { isActive: true } }),
        prisma.practicum.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
        prisma.user.count({ where: { role: "ASSISTANT", isActive: true } }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true } } },
        }),
      ]);

    return success({
      stats: { totalUsers, totalLabs, totalPracticums, totalStudents, totalAssistants },
      recentActivity: recentLogs,
    });
  })

  // ─── Lab Admin Dashboard ────────────────────────────────────────────
  .get("/laboratory", async ({ authUser }) => {
    if (authUser.role !== "LAB_ADMIN") return success(null);

    const lab = await prisma.laboratory.findFirst({
      where: { adminId: authUser.userId },
      select: { id: true, name: true },
    });

    if (!lab) return success({ stats: {}, lab: null });

    const [practicums, totalStudents, totalAssistants, pendingSubmissions] = await Promise.all([
      prisma.practicum.count({ where: { laboratoryId: lab.id, isActive: true } }),
      prisma.studentEnrollment.count({
        where: { practicumClass: { practicum: { laboratoryId: lab.id } }, status: "ACTIVE" },
      }),
      prisma.assistantAssignment.count({
        where: { practicumClass: { practicum: { laboratoryId: lab.id } } },
      }),
      prisma.submission.count({
        where: {
          status: { in: ["SUBMITTED", "LATE"] },
          assignment: { practicum: { laboratoryId: lab.id } },
        },
      }),
    ]);

    return success({
      lab,
      stats: { practicums, totalStudents, totalAssistants, pendingSubmissions },
    });
  })

  // ─── Assistant Dashboard ────────────────────────────────────────────
  .get("/assistant", async ({ authUser }) => {
    if (authUser.role !== "ASSISTANT") return success(null);

    const assignments = await prisma.assistantAssignment.findMany({
      where: { assistantId: authUser.userId },
      include: {
        practicumClass: {
          include: {
            practicum: { select: { id: true, name: true, code: true } },
            _count: { select: { studentEnrollments: { where: { status: "ACTIVE" } } } },
          },
        },
      },
    });

    const pendingSubmissions = await prisma.submission.count({
      where: {
        status: { in: ["SUBMITTED", "LATE"] },
        studentEnrollment: {
          practicumClass: {
            assistantAssignments: { some: { assistantId: authUser.userId } },
          },
        },
      },
    });

    return success({
      assignedClasses: assignments.map((a) => ({
        classId: a.practicumClass.id,
        className: a.practicumClass.name,
        practicum: a.practicumClass.practicum,
        studentCount: a.practicumClass._count.studentEnrollments,
      })),
      pendingSubmissions,
    });
  })

  // ─── Student Dashboard ──────────────────────────────────────────────
  .get("/student", async ({ authUser }) => {
    if (authUser.role !== "STUDENT") return success(null);

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId: authUser.userId, status: "ACTIVE" },
      include: {
        practicumClass: {
          include: {
            practicum: { select: { id: true, name: true, code: true } },
          },
        },
        publishedGrade: true,
      },
    });

    // Upcoming deadlines
    const upcomingDeadlines = await prisma.assignment.findMany({
      where: {
        deadline: { gte: new Date() },
        practicum: {
          classes: {
            some: {
              studentEnrollments: {
                some: { studentId: authUser.userId, status: "ACTIVE" },
              },
            },
          },
        },
      },
      select: { id: true, title: true, type: true, deadline: true },
      orderBy: { deadline: "asc" },
      take: 10,
    });

    const unreadNotifications = await prisma.notification.count({
      where: { userId: authUser.userId, isRead: false },
    });

    return success({
      enrolledPracticums: enrollments.map((e) => ({
        enrollmentId: e.id,
        classId: e.practicumClass.id,
        className: e.practicumClass.name,
        practicum: e.practicumClass.practicum,
        publishedGrade: e.publishedGrade
          ? { finalScore: e.publishedGrade.finalScore, letterGrade: e.publishedGrade.letterGrade }
          : null,
      })),
      upcomingDeadlines,
      unreadNotifications,
    });
  });
