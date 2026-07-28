import { apiClient } from "@/lib/api-client";
import { ApiResponse, UserRole } from "@/types";

export interface SystemStats {
  stats: {
    totalUsers: number;
    totalLabs: number;
    totalPracticums: number;
    totalStudents: number;
    totalAssistants: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: { fullName: string };
  }>;
}

export interface LaboratoryStats {
  lab: { id: string; name: string } | null;
  stats: {
    practicums: number;
    totalStudents: number;
    totalAssistants: number;
    pendingSubmissions: number;
  };
}

export interface AssistantStats {
  assignedClasses: Array<{
    classId: string;
    className: string;
    practicum: { id: string; name: string; code: string };
    studentCount: number;
  }>;
  pendingSubmissions: number;
}

export interface StudentStats {
  enrolledPracticums: Array<{
    enrollmentId: string;
    classId: string;
    className: string;
    practicum: { id: string; name: string; code: string };
    publishedGrade: { finalScore: number; letterGrade: string | null } | null;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: string;
    deadline: string;
  }>;
  unreadNotifications: number;
}

export const dashboardService = {
  async getDashboardData(role: UserRole) {
    let endpoint = "/dashboard/student";
    if (role === "SYSTEM_ADMIN") endpoint = "/dashboard/system";
    else if (role === "LAB_ADMIN") endpoint = "/dashboard/laboratory";
    else if (role === "ASSISTANT") endpoint = "/dashboard/assistant";

    const res = await apiClient.get<unknown, ApiResponse<any>>(endpoint);
    if (!res.success) {
      throw new Error(res.error?.message || "Failed to load dashboard data");
    }
    return res.data;
  },
};
