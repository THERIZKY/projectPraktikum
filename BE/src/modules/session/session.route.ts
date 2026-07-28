import Elysia from "elysia";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove, assistantOrAbove } from "../../middleware/rbac.middleware";
import { createSessionSchema, updateSessionSchema } from "./session.schema";
import * as sessionService from "./session.service";
import { success } from "../../utils/response";
import { auditAction } from "../../middleware/audit.middleware";

export const sessionRoutes = new Elysia()
  .use(authMiddleware)

  .get("/classes/:id/sessions", async ({ params }) => {
    const sessions = await sessionService.listSessions(params.id);
    return success(sessions);
  })

  .get("/sessions/:id", async ({ params }) => {
    const session = await sessionService.getSessionById(params.id);
    return success(session);
  })

  .post("/classes/:id/sessions", async ({ params, body, authUser }) => {
    const dto = createSessionSchema.parse(body);
    const session = await sessionService.createSession(params.id, dto);
    auditAction(authUser, "SESSION_CREATED", "session", session.id);
    return success(session);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .post("/classes/:id/sessions/bulk", async ({ params, authUser }) => {
    const result = await sessionService.bulkCreateSessions(params.id);
    auditAction(authUser, "SESSIONS_BULK_CREATED", "practicum_class", params.id, {
      newValues: { created: result.created },
    });
    return success(result);
  }, { beforeHandle: [labAdminOrAbove() as any] })

  .put("/sessions/:id", async ({ params, body, authUser }) => {
    const dto = updateSessionSchema.parse(body);
    const session = await sessionService.updateSession(params.id, dto);
    auditAction(authUser, "SESSION_UPDATED", "session", session.id);
    return success(session);
  }, { beforeHandle: [assistantOrAbove() as any] })

  .delete("/sessions/:id", async ({ params, authUser }) => {
    await sessionService.deleteSession(params.id);
    auditAction(authUser, "SESSION_DELETED", "session", params.id);
    return success({ message: "Session deleted" });
  }, { beforeHandle: [labAdminOrAbove() as any] });
