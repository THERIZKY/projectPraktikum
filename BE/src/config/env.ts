import { z } from "zod";

/**
 * Environment variable schema and validation.
 * All env vars are validated at startup — if any are missing or invalid,
 * the application crashes immediately with a clear error message.
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Email (SMTP)
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("noreply@university.ac.id"),

  // File Upload
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  STORAGE_BUCKET: z.string().default("practicum-files"),

  // Frontend URL
  FRONTEND_URL: z.string().url().default("http://localhost:3001"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("debug"),
});

/** Parse and validate environment variables */
function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error("❌ Invalid environment variables:\n" + formatted);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
