import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove, assistantOrAbove } from "../../middleware/rbac.middleware";
import {
  createGradingComponentSchema,
  updateGradingComponentSchema,
  inputGradeSchema,
  batchGradeSchema,
  setGradeLettersSchema,
} from "./grading.schema";
import * as gradingService from "./grading.service";
import { success } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";

/**
 * Grading routes.
 * Prefix: /api/v1
 */
export const gradingRoutes = new Elysia()
  .use(authMiddleware)

  // ─── Grading Component Config (LAB_ADMIN) ───────────────────────────
  .group("/practicums/:id/grading-components", (app) =>
    app
      .get("/", async ({ params }) => {
        const components = await gradingService.listComponents(params.id);
        return success(components);
      })

      .post("/", async ({ params, body, authUser }) => {
        const dto = createGradingComponentSchema.parse(body);
        const component = await gradingService.createComponent(params.id, dto);

        auditAction(authUser, "GRADING_COMPONENT_CREATED", "grading_component", component.id, {
          newValues: { name: dto.name, weight: dto.weight },
        });

        return success(component);
      }, { beforeHandle: [labAdminOrAbove() as any] })

      .put("/:componentId", async ({ params, body, authUser }) => {
        const dto = updateGradingComponentSchema.parse(body);
        const component = await gradingService.updateComponent(params.componentId, dto);

        auditAction(authUser, "GRADING_COMPONENT_UPDATED", "grading_component", params.componentId, {
          newValues: dto as Record<string, unknown>,
        });

        return success(component);
      }, { beforeHandle: [labAdminOrAbove() as any] })

      .delete("/:componentId", async ({ params, authUser }) => {
        await gradingService.deleteComponent(params.componentId);

        auditAction(authUser, "GRADING_COMPONENT_DELETED", "grading_component", params.componentId);

        return success({ message: "Grading component deleted" });
      }, { beforeHandle: [labAdminOrAbove() as any] })
  )

  // ─── Grade Letter Config (LAB_ADMIN) ────────────────────────────────
  .group("/practicums/:id/grade-letters", (app) =>
    app
      .get("/", async ({ params }) => {
        const letters = await gradingService.getGradeLetters(params.id);
        return success(letters);
      })

      .post("/", async ({ params, body, authUser }) => {
        const dto = setGradeLettersSchema.parse(body);
        const letters = await gradingService.setGradeLetters(params.id, dto);

        auditAction(authUser, "GRADE_LETTERS_CONFIGURED", "practicum", params.id);

        return success(letters);
      }, { beforeHandle: [labAdminOrAbove() as any] })
  )

  // ─── Grade Input (ASSISTANT+) ──────────────────────────────────────
  .post("/grades", async ({ body, authUser }) => {
    const dto = inputGradeSchema.parse(body);
    const grade = await gradingService.inputGrade(dto, authUser.userId);

    auditAction(authUser, "GRADE_ENTERED", "grade", grade.id, {
      newValues: {
        score: dto.score,
        studentEnrollmentId: dto.studentEnrollmentId,
        componentId: dto.gradingComponentId,
      },
    });

    return success(grade);
  }, { beforeHandle: [assistantOrAbove() as any] })

  .post("/grades/batch", async ({ body, authUser }) => {
    const dto = batchGradeSchema.parse(body);
    const results = await gradingService.batchInputGrades(dto, authUser.userId);

    auditAction(authUser, "GRADES_BATCH_ENTERED", "grade", undefined, {
      newValues: { count: results.length },
    });

    return success(results);
  }, { beforeHandle: [assistantOrAbove() as any] })

  // ─── Grade Views ──────────────────────────────────────────────────
  .get("/classes/:id/grades", async ({ params }) => {
    const summary = await gradingService.getClassGradeSummary(params.id);
    return success(summary);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .get("/enrollments/:id/grades", async ({ params }) => {
    const grades = await gradingService.getStudentGrades(params.id);
    return success(grades);
  })

  // ─── Grade Publishing (LAB_ADMIN) ─────────────────────────────────
  .post("/practicums/:id/grades/publish", async ({ params, authUser }) => {
    const result = await gradingService.publishGrades(params.id, authUser.userId);

    auditAction(authUser, "GRADES_PUBLISHED", "practicum", params.id, {
      newValues: { publishedCount: result.publishedCount },
    });

    return success(result);
  }, { beforeHandle: [labAdminOrAbove() as any] });
