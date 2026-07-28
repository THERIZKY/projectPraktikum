import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  scheduleDay: z.string().max(20).optional(),
  scheduleTime: z.string().max(20).optional(),
  room: z.string().max(100).optional(),
  maxStudents: z.number().int().min(1).optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const enrollStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, "At least one student ID required"),
});

export const assignAssistantsSchema = z.object({
  assistantIds: z.array(z.string().uuid()).min(1, "At least one assistant ID required"),
});

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;
