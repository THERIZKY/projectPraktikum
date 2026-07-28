import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove, assistantOrAbove } from "../../middleware/rbac.middleware";
import { createAssignmentSchema, updateAssignmentSchema, reviewSubmissionSchema } from "./submission.schema";
import { paginationSchema } from "../../lib/pagination";
import * as submissionService from "./submission.service";
import { success, paginated } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";
import type { SubmissionStatus } from "@prisma/client";

export const submissionRoutes = new Elysia()
  .use(authMiddleware)

  // ─── ASSIGNMENT ROUTES ────────────────────────────────────────────────

  .get("/practicums/:id/assignments", async ({ params }) => {
    const assignments = await submissionService.listAssignments(params.id);
    return success(assignments);
  })

  .get("/assignments/:id", async ({ params }) => {
    const assignment = await submissionService.getAssignmentById(params.id);
    return success(assignment);
  })

  .post("/practicums/:id/assignments", async ({ params, body, authUser }) => {
    const dto = createAssignmentSchema.parse(body);
    const assignment = await submissionService.createAssignment(params.id, dto);
    auditAction(authUser, "ASSIGNMENT_CREATED", "assignment", assignment.id);
    return success(assignment);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .put("/assignments/:id", async ({ params, body, authUser }) => {
    const dto = updateAssignmentSchema.parse(body);
    const assignment = await submissionService.updateAssignment(params.id, dto);
    auditAction(authUser, "ASSIGNMENT_UPDATED", "assignment", assignment.id);
    return success(assignment);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .delete("/assignments/:id", async ({ params, authUser }) => {
    await submissionService.deleteAssignment(params.id);
    auditAction(authUser, "ASSIGNMENT_DELETED", "assignment", params.id);
    return success({ message: "Assignment deleted" });
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── SUBMISSION ROUTES ────────────────────────────────────────────────

  .get("/assignments/:id/submissions", async ({ params, query }) => {
    const pagination = paginationSchema.parse(query);
    const statusFilter = query.status as SubmissionStatus | undefined;
    const { submissions, total } = await submissionService.listSubmissions(
      params.id, pagination, statusFilter
    );
    return paginated(submissions, total, pagination.page, pagination.limit);
  }, { beforeHandle: [assistantOrAbove() as any] })

  .get("/submissions/:id", async ({ params }) => {
    const submission = await submissionService.getSubmissionById(params.id);
    return success(submission);
  })

  .post("/assignments/:id/submissions", async ({ params, body, authUser }) => {
    // File upload handled via multipart/form-data
    const formData = body as any;
    const file = formData.file;

    if (!file) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "File is required" } };
    }

    // Get enrollment for current student
    const enrollment = await (await import("../../lib/prisma")).prisma.studentEnrollment.findFirst({
      where: {
        studentId: authUser.userId,
        status: "ACTIVE",
        practicumClass: {
          practicum: {
            assignments: { some: { id: params.id } },
          },
        },
      },
    });

    if (!enrollment) {
      return { success: false, error: { code: "FORBIDDEN", message: "You are not enrolled in this practicum" } };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const result = await submissionService.createSubmission(
      params.id,
      enrollment.id,
      {
        name: file.name,
        data: fileBuffer,
        type: file.type,
        size: file.size,
      },
      formData.revisionNotes as string | undefined
    );

    auditAction(authUser, "SUBMISSION_CREATED", "submission", result.submission.id);

    return success(result);
  })

  .patch("/submissions/:id/review", async ({ params, body, authUser }) => {
    const dto = reviewSubmissionSchema.parse(body);
    const submission = await submissionService.reviewSubmission(params.id, dto, authUser.userId);

    auditAction(authUser, "SUBMISSION_REVIEWED", "submission", params.id, {
      newValues: { status: dto.status, reviewNotes: dto.reviewNotes },
    });

    return success(submission);
  }, { beforeHandle: [assistantOrAbove() as any] })

  .get("/submissions/:id/versions/:versionId/download", async ({ params }) => {
    const result = await submissionService.getVersionDownloadUrl(params.versionId);
    return success(result);
  })

  // ─── My Submissions (Student) ─────────────────────────────────────
  .get("/my/submissions", async ({ query, authUser }) => {
    const pagination = paginationSchema.parse(query);
    const { submissions, total } = await submissionService.listMySubmissions(
      authUser.userId, pagination
    );
    return paginated(submissions, total, pagination.page, pagination.limit);
  });
