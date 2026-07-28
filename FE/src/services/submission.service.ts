import { apiClient } from "@/lib/api-client";
import { SubmissionStatus, ApiResponse, PaginatedResult } from "@/types";

export interface Submission {
  id: string;
  assignmentId: string;
  studentEnrollmentId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  studentEnrollment?: {
    student?: { fullName: string; nim: string; username: string };
  };
  assignment?: {
    title: string;
    deadline: string;
    type: string;
  };
  versions?: Array<{
    id: string;
    versionNumber: number;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
  }>;
}

export const submissionService = {
  async listMySubmissions(): Promise<PaginatedResult<Submission>> {
    const res = await apiClient.get<unknown, ApiResponse<Submission[]>>("/my/submissions");
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to fetch submissions");
    }
    return {
      data: res.data,
      meta: res.meta || { page: 1, limit: 50, total: res.data.length, totalPages: 1 },
    };
  },

  async reviewSubmission(id: string, status: SubmissionStatus, reviewNotes?: string): Promise<Submission> {
    const res = await apiClient.patch<unknown, ApiResponse<Submission>>(`/submissions/${id}/review`, {
      status,
      reviewNotes,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to review submission");
    }
    return res.data;
  },

  async uploadSubmission(assignmentId: string, file: File, revisionNotes?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (revisionNotes) formData.append("revisionNotes", revisionNotes);

    const res = await apiClient.post(`/assignments/${assignmentId}/submissions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res;
  },
};
