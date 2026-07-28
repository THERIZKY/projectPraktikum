import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError, ForbiddenError } from "../../utils/error";
import { uploadFile, getSignedUrl } from "../../lib/storage";
import { sanitizeFileName } from "../../utils/helpers";
import { env } from "../../config/env";
import type { CreateAssignmentDto, UpdateAssignmentDto, ReviewSubmissionDto } from "./submission.schema";
import type { Prisma, SubmissionStatus } from "@prisma/client";
import type { AuthUser } from "../../types/common";
import { getPrismaPageArgs, getPrismaOrderBy, type PaginationQuery } from "../../lib/pagination";

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────

export async function listAssignments(practicumId: string) {
  return prisma.assignment.findMany({
    where: { practicumId },
    include: {
      session: { select: { sessionNumber: true, title: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAssignmentById(id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      session: { select: { sessionNumber: true, title: true } },
      _count: { select: { submissions: true } },
    },
  });
  if (!assignment) throw new NotFoundError("Assignment", id);
  return assignment;
}

export async function createAssignment(practicumId: string, dto: CreateAssignmentDto) {
  return prisma.assignment.create({
    data: {
      practicumId,
      sessionId: dto.sessionId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      latePenaltyPercentage: dto.latePenaltyPercentage,
      latePenaltyUnit: dto.latePenaltyUnit,
      maxLatePenalty: dto.maxLatePenalty,
      maxFileSizeMb: dto.maxFileSizeMb,
      allowedFileTypes: dto.allowedFileTypes,
    },
  });
}

export async function updateAssignment(id: string, dto: UpdateAssignmentDto) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Assignment", id);

  return prisma.assignment.update({
    where: { id },
    data: {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      deadline: dto.deadline ? new Date(dto.deadline) : dto.deadline === null ? null : undefined,
      latePenaltyPercentage: dto.latePenaltyPercentage,
      latePenaltyUnit: dto.latePenaltyUnit,
      maxLatePenalty: dto.maxLatePenalty,
      maxFileSizeMb: dto.maxFileSizeMb,
      allowedFileTypes: dto.allowedFileTypes,
    },
  });
}

export async function deleteAssignment(id: string) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Assignment", id);
  await prisma.assignment.delete({ where: { id } });
}

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────

/**
 * List submissions for an assignment (for assistants/admins).
 */
export async function listSubmissions(
  assignmentId: string,
  query: PaginationQuery,
  statusFilter?: SubmissionStatus
) {
  const where: Prisma.SubmissionWhereInput = { assignmentId };
  if (statusFilter) where.status = statusFilter;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        studentEnrollment: {
          include: {
            student: { select: { id: true, fullName: true, nim: true } },
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1, // Only latest version
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
        _count: { select: { versions: true } },
      },
      ...getPrismaPageArgs(query),
      orderBy: getPrismaOrderBy(query, ["submittedAt", "status", "createdAt"]),
    }),
    prisma.submission.count({ where }),
  ]);

  return { submissions, total };
}

/**
 * Create a submission with file upload.
 * Determines SUBMITTED vs LATE based on deadline.
 */
export async function createSubmission(
  assignmentId: string,
  enrollmentId: string,
  file: { name: string; data: Buffer; type: string; size: number },
  revisionNotes?: string
) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new NotFoundError("Assignment", assignmentId);

  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: enrollmentId },
  });
  if (!enrollment) throw new NotFoundError("Student Enrollment", enrollmentId);

  // Validate file type
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  if (!assignment.allowedFileTypes.includes(fileExt)) {
    throw new ValidationError(
      `File type .${fileExt} is not allowed. Allowed: ${assignment.allowedFileTypes.join(", ")}`
    );
  }

  // Validate file size
  const maxBytes = assignment.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ValidationError(`File exceeds maximum size of ${assignment.maxFileSizeMb}MB`);
  }

  // Determine status based on deadline
  const now = new Date();
  let status: SubmissionStatus = "SUBMITTED";
  if (assignment.deadline && now > assignment.deadline) {
    status = "LATE";
  }

  // Check if submission already exists (resubmission)
  const existingSubmission = await prisma.submission.findFirst({
    where: { assignmentId, studentEnrollmentId: enrollmentId },
    include: { _count: { select: { versions: true } } },
  });

  const sanitizedName = sanitizeFileName(file.name);

  if (existingSubmission) {
    // Resubmit: add new version
    const newVersionNumber = existingSubmission._count.versions + 1;
    const storagePath = `submissions/${assignment.practicumId}/${assignmentId}/${enrollment.studentId}/v${newVersionNumber}_${sanitizedName}`;

    await uploadFile(env.STORAGE_BUCKET, storagePath, file.data, file.type);

    const version = await prisma.submissionVersion.create({
      data: {
        submissionId: existingSubmission.id,
        versionNumber: newVersionNumber,
        fileName: file.name,
        filePath: storagePath,
        fileSize: file.size,
        fileType: file.type,
        revisionNotes,
        uploadedBy: enrollment.studentId,
      },
    });

    await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: { status, submittedAt: now },
    });

    return { submission: existingSubmission, version };
  }

  // New submission
  const storagePath = `submissions/${assignment.practicumId}/${assignmentId}/${enrollment.studentId}/v1_${sanitizedName}`;
  await uploadFile(env.STORAGE_BUCKET, storagePath, file.data, file.type);

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentEnrollmentId: enrollmentId,
      status,
      submittedAt: now,
      versions: {
        create: {
          versionNumber: 1,
          fileName: file.name,
          filePath: storagePath,
          fileSize: file.size,
          fileType: file.type,
          revisionNotes,
          uploadedBy: enrollment.studentId,
        },
      },
    },
    include: { versions: true },
  });

  return { submission, version: submission.versions[0] };
}

/**
 * Get submission detail with all versions.
 */
export async function getSubmissionById(id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: { select: { id: true, title: true, type: true, deadline: true } },
      studentEnrollment: {
        include: {
          student: { select: { id: true, fullName: true, nim: true } },
        },
      },
      reviewer: { select: { id: true, fullName: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          uploader: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!submission) throw new NotFoundError("Submission", id);
  return submission;
}

/**
 * Review a submission (ASSISTANT).
 */
export async function reviewSubmission(
  id: string,
  dto: ReviewSubmissionDto,
  reviewerId: string
) {
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) throw new NotFoundError("Submission", id);

  return prisma.submission.update({
    where: { id },
    data: {
      status: dto.status as SubmissionStatus,
      reviewNotes: dto.reviewNotes,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Get a signed download URL for a specific submission version.
 */
export async function getVersionDownloadUrl(versionId: string) {
  const version = await prisma.submissionVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) throw new NotFoundError("Submission Version", versionId);

  const url = await getSignedUrl(env.STORAGE_BUCKET, version.filePath);
  return { url, fileName: version.fileName };
}

/**
 * List a student's own submissions across all practicums.
 */
export async function listMySubmissions(studentId: string, query: PaginationQuery) {
  const where: Prisma.SubmissionWhereInput = {
    studentEnrollment: { studentId },
  };

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        assignment: { select: { id: true, title: true, type: true, deadline: true } },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: { versionNumber: true, fileName: true, uploadedAt: true },
        },
      },
      ...getPrismaPageArgs(query),
      orderBy: { updatedAt: "desc" },
    }),
    prisma.submission.count({ where }),
  ]);

  return { submissions, total };
}
