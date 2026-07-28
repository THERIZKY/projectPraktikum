import { z } from "zod";
import { AssignmentType, LatePenaltyUnit } from "@prisma/client";

export const createAssignmentSchema = z.object({
  sessionId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.nativeEnum(AssignmentType),
  deadline: z.string().optional(), // ISO datetime
  latePenaltyPercentage: z.number().min(0).max(100).optional(),
  latePenaltyUnit: z.nativeEnum(LatePenaltyUnit).optional(),
  maxLatePenalty: z.number().min(0).max(100).optional(),
  maxFileSizeMb: z.number().int().min(1).max(100).default(25),
  allowedFileTypes: z.array(z.string()).default(["pdf", "docx"]),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const reviewSubmissionSchema = z.object({
  status: z.enum(["ACCEPTED", "REVISION_REQUESTED", "REJECTED"]),
  reviewNotes: z.string().optional(),
});

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;
export type ReviewSubmissionDto = z.infer<typeof reviewSubmissionSchema>;
