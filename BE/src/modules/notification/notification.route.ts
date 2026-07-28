import Elysia from "elysia";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { paginationSchema, getPrismaPageArgs } from "../../lib/pagination";
import { success, paginated } from "../../utils/response";

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .use(authMiddleware)

  .get("/", async ({ query, authUser }) => {
    const pagination = paginationSchema.parse(query);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: authUser.userId },
        ...getPrismaPageArgs(pagination),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId: authUser.userId } }),
    ]);

    return paginated(notifications, total, pagination.page, pagination.limit);
  })

  .get("/unread-count", async ({ authUser }) => {
    const count = await prisma.notification.count({
      where: { userId: authUser.userId, isRead: false },
    });
    return success({ count });
  })

  .patch("/:id/read", async ({ params, authUser }) => {
    await prisma.notification.updateMany({
      where: { id: params.id, userId: authUser.userId },
      data: { isRead: true, readAt: new Date() },
    });
    return success({ message: "Notification marked as read" });
  })

  .patch("/read-all", async ({ authUser }) => {
    await prisma.notification.updateMany({
      where: { userId: authUser.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return success({ message: "All notifications marked as read" });
  });
