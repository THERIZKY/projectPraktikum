import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove } from "../../middleware/rbac.middleware";
import { createPracticumSchema, updatePracticumSchema } from "./practicum.schema";
import { paginationSchema } from "../../lib/pagination";
import * as practicumService from "./practicum.service";
import { success, paginated } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";

/**
 * Practicum management routes.
 * Prefix: /api/v1/practicums
 */
export const practicumRoutes = new Elysia({ prefix: "/practicums" })
  .use(authMiddleware)

  // ─── GET /practicums (all authenticated, role-scoped) ────────────────
  .get("/", async ({ query, authUser }) => {
    const pagination = paginationSchema.parse(query);
    const filters = {
      academicYear: query.academicYear as string | undefined,
      semester: query.semester as string | undefined,
    };
    const { practicums, total } = await practicumService.listPracticums(
      pagination, authUser, filters
    );
    return paginated(practicums, total, pagination.page, pagination.limit);
  })

  // ─── GET /practicums/:id ─────────────────────────────────────────────
  .get("/:id", async ({ params, authUser }) => {
    const practicum = await practicumService.getPracticumById(params.id, authUser);
    return success(practicum);
  })

  // ─── POST /practicums (LAB_ADMIN+) ──────────────────────────────────
  .post("/", async ({ body, authUser }) => {
    const dto = createPracticumSchema.parse(body);
    const practicum = await practicumService.createPracticum(dto, authUser);

    auditAction(authUser, "PRACTICUM_CREATED", "practicum", practicum.id, {
      newValues: { name: practicum.name, code: practicum.code },
    });

    return success(practicum);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── PUT /practicums/:id (LAB_ADMIN+) ───────────────────────────────
  .put("/:id", async ({ params, body, authUser }) => {
    const dto = updatePracticumSchema.parse(body);
    const practicum = await practicumService.updatePracticum(params.id, dto, authUser);

    auditAction(authUser, "PRACTICUM_UPDATED", "practicum", practicum.id, {
      newValues: dto as Record<string, unknown>,
    });

    return success(practicum);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  // ─── DELETE /practicums/:id (LAB_ADMIN+) ────────────────────────────
  .delete("/:id", async ({ params, authUser }) => {
    await practicumService.deletePracticum(params.id, authUser);

    auditAction(authUser, "PRACTICUM_DELETED", "practicum", params.id);

    return success({ message: "Practicum deactivated successfully" });
  }, { beforeHandle: [labAdminOrAbove() as any] });
