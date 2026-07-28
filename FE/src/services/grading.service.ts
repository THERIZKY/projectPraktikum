import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";

export interface GradeItem {
  id: string;
  studentEnrollmentId: string;
  gradingComponentId: string;
  sessionId: string | null;
  score: number;
  feedback: string | null;
  gradedBy: string;
  component?: { name: string; weight: number };
}

export interface StudentGradeSummary {
  studentEnrollmentId: string;
  student: { fullName: string; nim: string; username: string };
  componentScores: Array<{
    componentId: string;
    componentName: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
  }>;
  finalScore: number;
  letterGrade: string | null;
  publishedGrade?: { finalScore: number; letterGrade: string | null };
}

export interface InputGradePayload {
  studentEnrollmentId: string;
  gradingComponentId: string;
  sessionId?: string;
  score: number;
  feedback?: string;
}

export const gradingService = {
  async getClassGrades(classId: string): Promise<StudentGradeSummary[]> {
    const res = await apiClient.get<unknown, ApiResponse<StudentGradeSummary[]>>(`/classes/${classId}/grades`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch class grades");
    }
    return res.data;
  },

  async inputGrade(payload: InputGradePayload): Promise<GradeItem> {
    const res = await apiClient.post<unknown, ApiResponse<GradeItem>>("/grades", payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to submit grade score");
    }
    return res.data;
  },

  async publishGrades(practicumId: string): Promise<{ publishedCount: number }> {
    const res = await apiClient.post<unknown, ApiResponse<{ publishedCount: number }>>(
      `/practicums/${practicumId}/grades/publish`
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to publish final grades");
    }
    return res.data;
  },
};
