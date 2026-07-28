import { z } from "zod";

export const createLabSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(50),
  description: z.string().optional(),
  adminId: z.string().uuid().optional(),
});

export const updateLabSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
});

export const assignAdminSchema = z.object({
  adminId: z.string().uuid().nullable(), // null to unassign
});

export type CreateLabDto = z.infer<typeof createLabSchema>;
export type UpdateLabDto = z.infer<typeof updateLabSchema>;
export type AssignAdminDto = z.infer<typeof assignAdminSchema>;
