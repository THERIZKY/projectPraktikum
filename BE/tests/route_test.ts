import { describe, test, expect } from "bun:test";
import { app } from "../src/app";

// Helper to make a request to Elysia app
async function req(method: string, path: string, headers: Record<string, string> = {}, body?: any) {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const response = await app.handle(new Request(`http://localhost${path}`, init));
  return response;
}

const DUMMY_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("API Route Compliance Audit (Section 15 Implementation Plan)", () => {
  const routesToTest = [
    // 15.2 Auth
    { name: "POST /auth/login", method: "POST", path: "/api/v1/auth/login" },
    { name: "POST /auth/refresh", method: "POST", path: "/api/v1/auth/refresh" },
    { name: "POST /auth/logout", method: "POST", path: "/api/v1/auth/logout" },
    { name: "POST /auth/forgot-password", method: "POST", path: "/api/v1/auth/forgot-password" },
    { name: "POST /auth/reset-password", method: "POST", path: "/api/v1/auth/reset-password" },
    { name: "GET /auth/me", method: "GET", path: "/api/v1/auth/me" },

    // 15.3 User
    { name: "GET /users", method: "GET", path: "/api/v1/users" },
    { name: "GET /users/:id", method: "GET", path: `/api/v1/users/${DUMMY_UUID}` },
    { name: "POST /users", method: "POST", path: "/api/v1/users" },
    { name: "POST /users/bulk-import", method: "POST", path: "/api/v1/users/bulk-import" },
    { name: "PUT /users/:id", method: "PUT", path: `/api/v1/users/${DUMMY_UUID}` },
    { name: "PATCH /users/:id/status", method: "PATCH", path: `/api/v1/users/${DUMMY_UUID}/status` },
    { name: "DELETE /users/:id", method: "DELETE", path: `/api/v1/users/${DUMMY_UUID}` },

    // 15.4 Laboratory
    { name: "GET /laboratories", method: "GET", path: "/api/v1/laboratories" },
    { name: "GET /laboratories/:id", method: "GET", path: `/api/v1/laboratories/${DUMMY_UUID}` },
    { name: "POST /laboratories", method: "POST", path: "/api/v1/laboratories" },
    { name: "PUT /laboratories/:id", method: "PUT", path: `/api/v1/laboratories/${DUMMY_UUID}` },
    { name: "DELETE /laboratories/:id", method: "DELETE", path: `/api/v1/laboratories/${DUMMY_UUID}` },
    { name: "PATCH /laboratories/:id/admin", method: "PATCH", path: `/api/v1/laboratories/${DUMMY_UUID}/admin` },

    // 15.5 Practicum
    { name: "GET /practicums", method: "GET", path: "/api/v1/practicums" },
    { name: "GET /practicums/:id", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}` },
    { name: "POST /practicums", method: "POST", path: "/api/v1/practicums" },
    { name: "PUT /practicums/:id", method: "PUT", path: `/api/v1/practicums/${DUMMY_UUID}` },
    { name: "DELETE /practicums/:id", method: "DELETE", path: `/api/v1/practicums/${DUMMY_UUID}` },
    { name: "GET /practicums/:id/statistics", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/statistics` },

    // 15.6 Class
    { name: "GET /practicums/:practicumId/classes", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/classes` },
    { name: "GET /classes/:id", method: "GET", path: `/api/v1/classes/${DUMMY_UUID}` },
    { name: "POST /practicums/:practicumId/classes", method: "POST", path: `/api/v1/practicums/${DUMMY_UUID}/classes` },
    { name: "PUT /classes/:id", method: "PUT", path: `/api/v1/classes/${DUMMY_UUID}` },
    { name: "DELETE /classes/:id", method: "DELETE", path: `/api/v1/classes/${DUMMY_UUID}` },
    { name: "GET /classes/:id/students", method: "GET", path: `/api/v1/classes/${DUMMY_UUID}/students` },
    { name: "POST /classes/:id/students", method: "POST", path: `/api/v1/classes/${DUMMY_UUID}/students` },
    { name: "DELETE /classes/:id/students/:studentId", method: "DELETE", path: `/api/v1/classes/${DUMMY_UUID}/students/${DUMMY_UUID}` },
    { name: "GET /classes/:id/assistants", method: "GET", path: `/api/v1/classes/${DUMMY_UUID}/assistants` },
    { name: "POST /classes/:id/assistants", method: "POST", path: `/api/v1/classes/${DUMMY_UUID}/assistants` },
    { name: "DELETE /classes/:id/assistants/:assistantId", method: "DELETE", path: `/api/v1/classes/${DUMMY_UUID}/assistants/${DUMMY_UUID}` },

    // 15.7 Session
    { name: "GET /classes/:classId/sessions", method: "GET", path: `/api/v1/classes/${DUMMY_UUID}/sessions` },
    { name: "GET /sessions/:id", method: "GET", path: `/api/v1/sessions/${DUMMY_UUID}` },
    { name: "POST /classes/:classId/sessions", method: "POST", path: `/api/v1/classes/${DUMMY_UUID}/sessions` },
    { name: "POST /classes/:classId/sessions/bulk", method: "POST", path: `/api/v1/classes/${DUMMY_UUID}/sessions/bulk` },
    { name: "PUT /sessions/:id", method: "PUT", path: `/api/v1/sessions/${DUMMY_UUID}` },
    { name: "DELETE /sessions/:id", method: "DELETE", path: `/api/v1/sessions/${DUMMY_UUID}` },

    // 15.8 Session Materials
    { name: "GET /sessions/:sessionId/materials", method: "GET", path: `/api/v1/sessions/${DUMMY_UUID}/materials` },
    { name: "POST /sessions/:sessionId/materials", method: "POST", path: `/api/v1/sessions/${DUMMY_UUID}/materials` },
    { name: "DELETE /materials/:id", method: "DELETE", path: `/api/v1/materials/${DUMMY_UUID}` },
    { name: "GET /materials/:id/download", method: "GET", path: `/api/v1/materials/${DUMMY_UUID}/download` },

    // 15.9 Attendance
    { name: "GET /sessions/:sessionId/attendances", method: "GET", path: `/api/v1/sessions/${DUMMY_UUID}/attendances` },
    { name: "POST /sessions/:sessionId/attendances", method: "POST", path: `/api/v1/sessions/${DUMMY_UUID}/attendances` },
    { name: "PUT /attendances/:id", method: "PUT", path: `/api/v1/attendances/${DUMMY_UUID}` },

    // 15.10 Grading Configuration
    { name: "GET /practicums/:id/grading-components", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/grading-components` },
    { name: "POST /practicums/:id/grading-components", method: "POST", path: `/api/v1/practicums/${DUMMY_UUID}/grading-components` },
    { name: "PUT /grading-components/:id", method: "PUT", path: `/api/v1/grading-components/${DUMMY_UUID}` },
    { name: "DELETE /grading-components/:id", method: "DELETE", path: `/api/v1/grading-components/${DUMMY_UUID}` },
    { name: "GET /practicums/:id/grade-letters", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/grade-letters` },
    { name: "POST /practicums/:id/grade-letters", method: "POST", path: `/api/v1/practicums/${DUMMY_UUID}/grade-letters` },
    { name: "PUT /grade-letters/:id", method: "PUT", path: `/api/v1/grade-letters/${DUMMY_UUID}` },

    // 15.11 Grades
    { name: "GET /classes/:classId/grades", method: "GET", path: `/api/v1/classes/${DUMMY_UUID}/grades` },
    { name: "GET /enrollments/:enrollmentId/grades", method: "GET", path: `/api/v1/enrollments/${DUMMY_UUID}/grades` },
    { name: "POST /grades", method: "POST", path: "/api/v1/grades" },
    { name: "POST /grades/batch", method: "POST", path: "/api/v1/grades/batch" },
    { name: "PUT /grades/:id", method: "PUT", path: `/api/v1/grades/${DUMMY_UUID}` },
    { name: "GET /practicums/:id/grades/summary", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/grades/summary` },
    { name: "POST /practicums/:id/grades/publish", method: "POST", path: `/api/v1/practicums/${DUMMY_UUID}/grades/publish` },

    // 15.12 Assignments
    { name: "GET /practicums/:id/assignments", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/assignments` },
    { name: "GET /assignments/:id", method: "GET", path: `/api/v1/assignments/${DUMMY_UUID}` },
    { name: "POST /practicums/:id/assignments", method: "POST", path: `/api/v1/practicums/${DUMMY_UUID}/assignments` },
    { name: "PUT /assignments/:id", method: "PUT", path: `/api/v1/assignments/${DUMMY_UUID}` },
    { name: "DELETE /assignments/:id", method: "DELETE", path: `/api/v1/assignments/${DUMMY_UUID}` },

    // 15.13 Submissions
    { name: "GET /assignments/:assignmentId/submissions", method: "GET", path: `/api/v1/assignments/${DUMMY_UUID}/submissions` },
    { name: "GET /submissions/:id", method: "GET", path: `/api/v1/submissions/${DUMMY_UUID}` },
    { name: "POST /assignments/:assignmentId/submissions", method: "POST", path: `/api/v1/assignments/${DUMMY_UUID}/submissions` },
    { name: "GET /submissions/:id/versions", method: "GET", path: `/api/v1/submissions/${DUMMY_UUID}/versions` },
    { name: "POST /submissions/:id/resubmit", method: "POST", path: `/api/v1/submissions/${DUMMY_UUID}/resubmit` },
    { name: "PATCH /submissions/:id/review", method: "PATCH", path: `/api/v1/submissions/${DUMMY_UUID}/review` },
    { name: "GET /submissions/:id/versions/:versionId/download", method: "GET", path: `/api/v1/submissions/${DUMMY_UUID}/versions/${DUMMY_UUID}/download` },
    { name: "GET /my/submissions", method: "GET", path: "/api/v1/my/submissions" },

    // 15.14 Announcements
    { name: "GET /announcements", method: "GET", path: "/api/v1/announcements" },
    { name: "GET /announcements/:id", method: "GET", path: `/api/v1/announcements/${DUMMY_UUID}` },
    { name: "POST /announcements", method: "POST", path: "/api/v1/announcements" },
    { name: "PUT /announcements/:id", method: "PUT", path: `/api/v1/announcements/${DUMMY_UUID}` },
    { name: "DELETE /announcements/:id", method: "DELETE", path: `/api/v1/announcements/${DUMMY_UUID}` },

    // 15.15 Notifications
    { name: "GET /notifications", method: "GET", path: "/api/v1/notifications" },
    { name: "GET /notifications/unread-count", method: "GET", path: "/api/v1/notifications/unread-count" },
    { name: "PATCH /notifications/:id/read", method: "PATCH", path: `/api/v1/notifications/${DUMMY_UUID}/read` },
    { name: "PATCH /notifications/read-all", method: "PATCH", path: "/api/v1/notifications/read-all" },

    // 15.16 Audit Logs
    { name: "GET /audit-logs", method: "GET", path: "/api/v1/audit-logs" },
    { name: "GET /audit-logs/:id", method: "GET", path: `/api/v1/audit-logs/${DUMMY_UUID}` },

    // 15.17 Profile
    { name: "GET /profile", method: "GET", path: "/api/v1/profile" },
    { name: "PUT /profile", method: "PUT", path: "/api/v1/profile" },
    { name: "PUT /profile/password", method: "PUT", path: "/api/v1/profile/password" },
    { name: "POST /profile/avatar", method: "POST", path: "/api/v1/profile/avatar" },

    // 15.18 Export
    { name: "GET /practicums/:id/export/grades", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/export/grades` },
    { name: "GET /practicums/:id/export/attendance", method: "GET", path: `/api/v1/practicums/${DUMMY_UUID}/export/attendance` },

    // 15.19 Settings
    { name: "GET /settings", method: "GET", path: "/api/v1/settings" },
    { name: "GET /settings/:key", method: "GET", path: "/api/v1/settings/max_file_size" },
    { name: "PUT /settings/:key", method: "PUT", path: "/api/v1/settings/max_file_size" },

    // 15.20 Dashboard
    { name: "GET /dashboard/system", method: "GET", path: "/api/v1/dashboard/system" },
    { name: "GET /dashboard/laboratory", method: "GET", path: "/api/v1/dashboard/laboratory" },
    { name: "GET /dashboard/assistant", method: "GET", path: "/api/v1/dashboard/assistant" },
    { name: "GET /dashboard/student", method: "GET", path: "/api/v1/dashboard/student" },
  ];

  for (const item of routesToTest) {
    test(`Endpoint Exists: ${item.name}`, async () => {
      const res = await req(item.method, item.path);
      // Status should NOT be 404 (404 means the route handler is missing or path mismatch in Elysia router)
      // Note: 401 (Unauthorized), 400 (Bad Request/Validation), 403 (Forbidden), or 200/500 all mean the route IS registered.
      expect(res.status).not.toBe(404);
    });
  }
});
