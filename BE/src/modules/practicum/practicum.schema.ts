import { z } from "zod";
import { Semester } from "@prisma/client";

export const createPracticumSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(50),
  description: z.string().optional(),
  academicYear: z.string().regex(/^\d{4}\/\d{4}$/, "Format must be YYYY/YYYY (e.g., 2026/2027)"),
  semester: z.nativeEnum(Semester),
  totalSessions: z.number().int().min(1).max(30).default(14),
});

export const updatePracticumSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  totalSessions: z.number().int().min(1).max(30).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePracticumDto = z.infer<typeof createPracticumSchema>;
export type UpdatePracticumDto = z.infer<typeof updatePracticumSchema>;
