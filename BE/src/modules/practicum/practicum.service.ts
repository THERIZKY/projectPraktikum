import { prisma } from "../../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/error";
import { getPrismaPageArgs, getPrismaOrderBy, type PaginationQuery } from "../../lib/pagination";
import type { CreatePracticumDto, UpdatePracticumDto } from "./practicum.schema";
import type { Prisma, UserRole } from "@prisma/client";
import type { AuthUser } from "../../types/common";

const practicumSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  academicYear: true,
  semester: true,
  totalSessions: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  laboratory: {
    select: { id: true, name: true, code: true },
  },
  _count: {
    select: {
      classes: true,
      gradingComponents: true,
      assignments: true,
    },
  },
} satisfies Prisma.PracticumSelect;

/**
 * Get the laboratory ID that the current user manages.
 * Used for Lab Admin scoping.
 */
async function getLabIdForAdmin(userId: string): Promise<string> {
  const lab = await prisma.laboratory.findFirst({
    where: { adminId: userId, isActive: true },
    select: { id: true },
  });

  if (!lab) throw new ForbiddenError("You are not assigned to any laboratory");
  return lab.id;
}

/**
 * Verify that a practicum belongs to the user's laboratory.
 */
async function verifyPracticumAccess(practicumId: string, authUser: AuthUser) {
  if (authUser.role === "SYSTEM_ADMIN") return;

  const labId = await getLabIdForAdmin(authUser.userId);
  const practicum = await prisma.practicum.findUnique({
    where: { id: practicumId },
    select: { laboratoryId: true },
  });

  if (!practicum) throw new NotFoundError("Practicum", practicumId);
  if (practicum.laboratoryId !== labId) {
    throw new ForbiddenError("You can only access practicums in your laboratory");
  }
}

export async function listPracticums(
  query: PaginationQuery,
  authUser: AuthUser,
  filters?: { academicYear?: string; semester?: string }
) {
  const where: Prisma.PracticumWhereInput = { isActive: true };

  // Scope by role
  if (authUser.role === "LAB_ADMIN") {
    const labId = await getLabIdForAdmin(authUser.userId);
    where.laboratoryId = labId;
  } else if (authUser.role === "ASSISTANT") {
    // Only practicums with assigned classes
    where.classes = {
      some: {
        assistantAssignments: { some: { assistantId: authUser.userId } },
      },
    };
  } else if (authUser.role === "STUDENT") {
    // Only enrolled practicums
    where.classes = {
      some: {
        studentEnrollments: {
          some: { studentId: authUser.userId, status: "ACTIVE" },
        },
      },
    };
  }

  if (filters?.academicYear) where.academicYear = filters.academicYear;
  if (filters?.semester) where.semester = filters.semester as any;

  if (query.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { code: { contains: query.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [practicums, total] = await Promise.all([
    prisma.practicum.findMany({
      where,
      select: practicumSelect,
      ...getPrismaPageArgs(query),
      orderBy: getPrismaOrderBy(query, ["name", "code", "academicYear", "createdAt"]),
    }),
    prisma.practicum.count({ where }),
  ]);

  return { practicums, total };
}

export async function getPracticumById(id: string, authUser: AuthUser) {
  await verifyPracticumAccess(id, authUser);

  const practicum = await prisma.practicum.findUnique({
    where: { id },
    select: {
      ...practicumSelect,
      gradingComponents: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          weight: true,
          order: true,
          isPerSession: true,
          aggregationMethod: true,
          maxScore: true,
        },
      },
    },
  });

  if (!practicum) throw new NotFoundError("Practicum", id);
  return practicum;
}

export async function createPracticum(dto: CreatePracticumDto, authUser: AuthUser) {
  const labId = await getLabIdForAdmin(authUser.userId);

  // Check for duplicate code in same academic period
  const existing = await prisma.practicum.findFirst({
    where: {
      code: dto.code,
      academicYear: dto.academicYear,
      semester: dto.semester,
    },
  });
  if (existing) {
    throw new ConflictError("A practicum with this code already exists in this academic period");
  }

  return prisma.practicum.create({
    data: {
      laboratoryId: labId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      academicYear: dto.academicYear,
      semester: dto.semester,
      totalSessions: dto.totalSessions,
    },
    select: practicumSelect,
  });
}

export async function updatePracticum(id: string, dto: UpdatePracticumDto, authUser: AuthUser) {
  await verifyPracticumAccess(id, authUser);

  return prisma.practicum.update({
    where: { id },
    data: {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      totalSessions: dto.totalSessions,
      isActive: dto.isActive,
    },
    select: practicumSelect,
  });
}

export async function deletePracticum(id: string, authUser: AuthUser) {
  await verifyPracticumAccess(id, authUser);

  await prisma.practicum.update({
    where: { id },
    data: { isActive: false },
  });
}
