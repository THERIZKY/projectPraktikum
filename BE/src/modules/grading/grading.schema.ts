import { z } from "zod";
import { AggregationMethod } from "@prisma/client";

export const createGradingComponentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  weight: z.number().min(0.0001).max(1), // 0.01% to 100%
  order: z.number().int().min(0),
  isPerSession: z.boolean().default(false),
  aggregationMethod: z.nativeEnum(AggregationMethod).default("AVERAGE"),
  maxScore: z.number().min(1).default(100),
});

export const updateGradingComponentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  weight: z.number().min(0.0001).max(1).optional(),
  order: z.number().int().min(0).optional(),
  isPerSession: z.boolean().optional(),
  aggregationMethod: z.nativeEnum(AggregationMethod).optional(),
  maxScore: z.number().min(1).optional(),
});

export const inputGradeSchema = z.object({
  studentEnrollmentId: z.string().uuid(),
  gradingComponentId: z.string().uuid(),
  sessionId: z.string().uuid().optional(), // Required for per-session grades
  score: z.number().min(0),
  feedback: z.string().optional(),
});

export const batchGradeSchema = z.object({
  grades: z.array(inputGradeSchema).min(1, "At least one grade is required"),
});

export const gradeLetterSchema = z.object({
  letter: z.string().min(1).max(5),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
  gradePoint: z.number().min(0).max(4).optional(),
  order: z.number().int().min(0),
});

export const setGradeLettersSchema = z.object({
  letters: z.array(gradeLetterSchema).min(1),
});

export type CreateGradingComponentDto = z.infer<typeof createGradingComponentSchema>;
export type UpdateGradingComponentDto = z.infer<typeof updateGradingComponentSchema>;
export type InputGradeDto = z.infer<typeof inputGradeSchema>;
export type BatchGradeDto = z.infer<typeof batchGradeSchema>;
export type SetGradeLettersDto = z.infer<typeof setGradeLettersSchema>;
