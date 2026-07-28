export type UserRole = "SYSTEM_ADMIN" | "LAB_ADMIN" | "ASSISTANT" | "STUDENT";

export type Semester = "ODD" | "EVEN";

export type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type AssignmentType =
  | "LAB_REPORT"
  | "FINAL_REPORT"
  | "COMPREHENSIVE_REPORT"
  | "PROJECT"
  | "QUIZ"
  | "OTHER";

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "LATE"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "ACCEPTED"
  | "REJECTED";

export type AggregationMethod = "AVERAGE" | "SUM" | "HIGHEST" | "LATEST";

export type LatePenaltyUnit = "PER_HOUR" | "PER_DAY" | "FLAT";

export type NotificationType = "ANNOUNCEMENT" | "GRADE" | "DEADLINE" | "SUBMISSION" | "SYSTEM";

export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type EnrollmentStatus = "ACTIVE" | "DROPPED" | "COMPLETED";

// Core User Model
export interface User {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  nim: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Auth Tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API Response Standard Wrappers
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
