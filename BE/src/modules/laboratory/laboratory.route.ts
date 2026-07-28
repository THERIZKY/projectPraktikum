import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminOnly } from "../../middleware/rbac.middleware";
import { createLabSchema, updateLabSchema, assignAdminSchema } from "./laboratory.schema";
import { paginationSchema } from "../../lib/pagination";
import * as labService from "./laboratory.service";
import { success, paginated } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";

/**
 * Laboratory management routes.
 * Prefix: /api/v1/laboratories
 * All routes require SYSTEM_ADMIN role.
 */
export const laboratoryRoutes = new Elysia({ prefix: "/laboratories" })
  .use(authMiddleware)
  .use(adminOnly())

  .get("/", async ({ query }) => {
    const pagination = paginationSchema.parse(query);
    const { labs, total } = await labService.listLaboratories(pagination);
    return paginated(labs, total, pagination.page, pagination.limit);
  })

  .get("/:id", async ({ params }) => {
    const lab = await labService.getLabById(params.id);
    return success(lab);
  })

  .post("/", async ({ body, authUser }) => {
    const dto = createLabSchema.parse(body);
    const lab = await labService.createLab(dto);

    auditAction(authUser, "LABORATORY_CREATED", "laboratory", lab.id, {
      newValues: { name: lab.name, code: lab.code },
    });

    return success(lab);
  })

  .put("/:id", async ({ params, body, authUser }) => {
    const dto = updateLabSchema.parse(body);
    const lab = await labService.updateLab(params.id, dto);

    auditAction(authUser, "LABORATORY_UPDATED", "laboratory", lab.id, {
      newValues: dto as Record<string, unknown>,
    });

    return success(lab);
  })

  .patch("/:id/admin", async ({ params, body, authUser }) => {
    const dto = assignAdminSchema.parse(body);
    const lab = await labService.assignAdmin(params.id, dto);

    auditAction(authUser, "LABORATORY_ADMIN_ASSIGNED", "laboratory", lab.id, {
      newValues: { adminId: dto.adminId },
    });

    return success(lab);
  })

  .delete("/:id", async ({ params, authUser }) => {
    await labService.deleteLab(params.id);

    auditAction(authUser, "LABORATORY_DELETED", "laboratory", params.id);

    return success({ message: "Laboratory deactivated successfully" });
  });
