import { describe, test, expect } from "bun:test";
import { app } from "../src/app";

async function req(method: string, path: string, body?: any, headers: Record<string, string> = {}) {
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
  return app.handle(new Request(`http://localhost${path}`, init));
}

describe("Request Handling & Middleware Validation Tests", () => {
  // 1. Auth Validation (Username + Password)
  test("POST /api/v1/auth/login missing fields returns 400 validation error", async () => {
    const res = await req("POST", "/api/v1/auth/login", {});
    const json = await res.json() as any;
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  test("POST /api/v1/auth/login with username and invalid password attempts auth", async () => {
    const res = await req("POST", "/api/v1/auth/login", {
      username: "221511001",
      password: "wrongpassword",
    });
    // Returns 401 or 500 depending on DB connectivity in test env, but payload must be accepted by Zod
    expect(res.status).not.toBe(400);
  });
});
