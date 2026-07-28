import { z } from "zod";
import { SessionStatus } from "@prisma/client";

export const createSessionSchema = z.object({
  sessionNumber: z.number().int().min(1),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  date: z.string().optional(), // ISO date string
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  assistantNotes: z.string().nullable().optional(),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
