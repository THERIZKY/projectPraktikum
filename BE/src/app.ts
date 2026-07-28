import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { errorMiddleware } from "./middleware/error.middleware";
import { env } from "./config/env";

import { authRoutes } from "./modules/auth/auth.route";
import { profileRoutes } from "./modules/profile/profile.route";
import { userRoutes } from "./modules/user/user.route";
import { laboratoryRoutes } from "./modules/laboratory/laboratory.route";
import { practicumRoutes } from "./modules/practicum/practicum.route";
import { classRoutes } from "./modules/class/class.route";
import { sessionRoutes } from "./modules/session/session.route";
import { gradingRoutes } from "./modules/grading/grading.route";
import { submissionRoutes } from "./modules/submission/submission.route";
import { attendanceRoutes } from "./modules/attendance/attendance.route";
import { announcementRoutes } from "./modules/announcement/announcement.route";
import { notificationRoutes } from "./modules/notification/notification.route";
import { auditLogRoutes } from "./modules/audit-log/audit-log.route";
import { exportRoutes } from "./modules/export/export.route";
import { dashboardRoutes } from "./modules/dashboard/dashboard.route";

// Group API v1 routes with /api/v1 prefix
const apiV1 = new Elysia({ prefix: "/api/v1" })
  .use(authRoutes)
  .use(profileRoutes)
  .use(userRoutes)
  .use(laboratoryRoutes)
  .use(practicumRoutes)
  .use(classRoutes)
  .use(sessionRoutes)
  .use(gradingRoutes)
  .use(submissionRoutes)
  .use(attendanceRoutes)
  .use(announcementRoutes)
  .use(notificationRoutes)
  .use(auditLogRoutes)
  .use(exportRoutes)
  .use(dashboardRoutes);

export const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Practicum Management System API",
          version: "1.0.0",
          description: "REST API documentation for the Practicum Management System backend",
        },
        tags: [
          { name: "Auth", description: "Authentication & session management" },
          { name: "Profile", description: "User profile management" },
          { name: "User", description: "User account management (System Admin)" },
          { name: "Laboratory", description: "Laboratory management" },
          { name: "Practicum", description: "Practicum course management" },
          { name: "Class", description: "Class & enrollment management" },
          { name: "Session", description: "Practicum session management" },
          { name: "Grading", description: "Dynamic grading engine & scores" },
          { name: "Submission", description: "Assignment submissions & file versioning" },
          { name: "Attendance", description: "Session attendance tracking" },
          { name: "Announcement", description: "Laboratory announcements" },
          { name: "Notification", description: "In-app notifications" },
          { name: "Audit Log", description: "Audit logging" },
          { name: "Export", description: "Excel report exports" },
          { name: "Dashboard", description: "Role-specific dashboards" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Enter your Bearer JWT access token",
            },
          },
        },
      },
    })
  )
  .use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  )
  .use(errorMiddleware)
  .get("/", () => ({
    name: "Practicum Management System API",
    status: "online",
    version: "1.0.0",
    docs: "/swagger",
    apiPrefix: "/api/v1",
  }))
  .use(apiV1);
