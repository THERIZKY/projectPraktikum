import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove } from "../../middleware/rbac.middleware";
import { createClassSchema, updateClassSchema, enrollStudentsSchema, assignAssistantsSchema } from "./class.schema";
import * as classService from "./class.service";
import { success } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";

export const classRoutes = new Elysia()
  .use(authMiddleware)

  // ─── List classes for a practicum ───────────────────────────────────
  .get("/practicums/:id/classes", async ({ params }) => {
    const classes = await classService.listClasses(params.id);
    return success(classes);
  })

  // ─── Get class detail ─────────────────────────────────────────────
  .get("/classes/:id", async ({ params }) => {
    const cls = await classService.getClassById(params.id);
    return success(cls);
  })

  // ─── Create class (LAB_ADMIN+) ────────────────────────────────────
  .post("/practicums/:id/classes", async ({ params, body, authUser }) => {
    const dto = createClassSchema.parse(body);
    const cls = await classService.createClass(params.id, dto);
    auditAction(authUser, "CLASS_CREATED", "practicum_class", cls.id);
    return success(cls);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── Update class ─────────────────────────────────────────────────
  .put("/classes/:id", async ({ params, body, authUser }) => {
    const dto = updateClassSchema.parse(body);
    const cls = await classService.updateClass(params.id, dto);
    auditAction(authUser, "CLASS_UPDATED", "practicum_class", cls.id);
    return success(cls);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── Delete class ─────────────────────────────────────────────────
  .delete("/classes/:id", async ({ params, authUser }) => {
    await classService.deleteClass(params.id);
    auditAction(authUser, "CLASS_DELETED", "practicum_class", params.id);
    return success({ message: "Class deactivated" });
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── Enroll students ──────────────────────────────────────────────
  .post("/classes/:id/students", async ({ params, body, authUser }) => {
    const dto = enrollStudentsSchema.parse(body);
    const result = await classService.enrollStudents(params.id, dto.studentIds);
    auditAction(authUser, "STUDENTS_ENROLLED", "practicum_class", params.id, {
      newValues: { studentIds: dto.studentIds, count: result.length },
    });
    return success(result);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── Unenroll student ─────────────────────────────────────────────
  .delete("/classes/:id/students/:studentId", async ({ params, authUser }) => {
    await classService.unenrollStudent(params.id, params.studentId);
    auditAction(authUser, "STUDENT_UNENROLLED", "practicum_class", params.id);
    return success({ message: "Student unenrolled" });
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── Assign assistants ────────────────────────────────────────────
  .post("/classes/:id/assistants", async ({ params, body, authUser }) => {
    const dto = assignAssistantsSchema.parse(body);
    const result = await classService.assignAssistants(params.id, dto.assistantIds);
    auditAction(authUser, "ASSISTANTS_ASSIGNED", "practicum_class", params.id);
    return success(result);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── Unassign assistant ───────────────────────────────────────────
  .delete("/classes/:id/assistants/:assistantId", async ({ params, authUser }) => {
    await classService.unassignAssistant(params.id, params.assistantId);
    auditAction(authUser, "ASSISTANT_UNASSIGNED", "practicum_class", params.id);
    return success({ message: "Assistant unassigned" });
  }, { beforeHandle: [labAdminOrAbove() as any] });
