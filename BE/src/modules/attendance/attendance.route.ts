import Elysia from "elysia";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { assistantOrAbove } from "../../middleware/rbac.middleware";
import { success } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";
import type { AttendanceStatus } from "@prisma/client";

const recordAttendanceSchema = z.object({
  records: z.array(z.object({
    studentEnrollmentId: z.string().uuid(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    checkInTime: z.string().optional(),
    notes: z.string().optional(),
  })).min(1),
});

export const attendanceRoutes = new Elysia()
  .use(authMiddleware)

  // ─── GET attendance for a session ─────────────────────────────────
  .get("/sessions/:id/attendances", async ({ params }) => {
    const attendances = await prisma.attendance.findMany({
      where: { sessionId: params.id },
      include: {
        studentEnrollment: {
          include: {
            student: { select: { id: true, fullName: true, nim: true } },
          },
        },
        recorder: { select: { fullName: true } },
      },
      orderBy: { studentEnrollment: { student: { fullName: "asc" } } },
    });
    return success(attendances);
  }, { beforeHandle: [assistantOrAbove() as any] })

  // ─── POST batch attendance ────────────────────────────────────────
  .post("/sessions/:id/attendances", async ({ params, body, authUser }) => {
    const dto = recordAttendanceSchema.parse(body);
    const results = [];

    for (const record of dto.records) {
      const existing = await prisma.attendance.findFirst({
        where: {
          sessionId: params.id,
          studentEnrollmentId: record.studentEnrollmentId,
        },
      });

      if (existing) {
        // Update existing attendance
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status as AttendanceStatus,
            checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
            notes: record.notes,
          },
        });
        results.push(updated);
      } else {
        // Create new attendance
        const created = await prisma.attendance.create({
          data: {
            sessionId: params.id,
            studentEnrollmentId: record.studentEnrollmentId,
            status: record.status as AttendanceStatus,
            checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
            notes: record.notes,
            recordedBy: authUser.userId,
          },
        });
        results.push(created);
      }
    }

    auditAction(authUser, "ATTENDANCE_RECORDED", "session", params.id, {
      newValues: { count: results.length },
    });

    return success(results);
  }, { beforeHandle: [assistantOrAbove() as any] });
