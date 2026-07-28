import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/error";
import type { CreateClassDto, UpdateClassDto } from "./class.schema";
import type { Prisma } from "@prisma/client";

const classSelect = {
  id: true,
  name: true,
  scheduleDay: true,
  scheduleTime: true,
  room: true,
  maxStudents: true,
  isActive: true,
  createdAt: true,
  practicum: {
    select: { id: true, name: true, code: true },
  },
  _count: {
    select: {
      studentEnrollments: true,
      assistantAssignments: true,
      sessions: true,
    },
  },
} satisfies Prisma.PracticumClassSelect;

export async function listClasses(practicumId: string) {
  return prisma.practicumClass.findMany({
    where: { practicumId, isActive: true },
    select: classSelect,
    orderBy: { name: "asc" },
  });
}

export async function getClassById(id: string) {
  const cls = await prisma.practicumClass.findUnique({
    where: { id },
    select: {
      ...classSelect,
      studentEnrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: { select: { id: true, fullName: true, nim: true, email: true } },
        },
        orderBy: { student: { fullName: "asc" } },
      },
      assistantAssignments: {
        include: {
          assistant: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  if (!cls) throw new NotFoundError("Class", id);
  return cls;
}

export async function createClass(practicumId: string, dto: CreateClassDto) {
  const existing = await prisma.practicumClass.findFirst({
    where: { practicumId, name: dto.name },
  });
  if (existing) throw new ConflictError("A class with this name already exists in this practicum");

  return prisma.practicumClass.create({
    data: { practicumId, ...dto },
    select: classSelect,
  });
}

export async function updateClass(id: string, dto: UpdateClassDto) {
  const existing = await prisma.practicumClass.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Class", id);

  return prisma.practicumClass.update({
    where: { id },
    data: dto,
    select: classSelect,
  });
}

export async function deleteClass(id: string) {
  const existing = await prisma.practicumClass.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Class", id);

  await prisma.practicumClass.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Enroll students into a class.
 */
export async function enrollStudents(classId: string, studentIds: string[]) {
  const cls = await prisma.practicumClass.findUnique({
    where: { id: classId },
    include: { _count: { select: { studentEnrollments: { where: { status: "ACTIVE" } } } } },
  });

  if (!cls) throw new NotFoundError("Class", classId);

  // Check capacity
  if (cls.maxStudents) {
    const currentCount = cls._count.studentEnrollments;
    if (currentCount + studentIds.length > cls.maxStudents) {
      throw new ValidationError(
        `Class capacity exceeded. Max: ${cls.maxStudents}, Current: ${currentCount}, Attempting to add: ${studentIds.length}`
      );
    }
  }

  // Verify all students exist and have STUDENT role
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: "STUDENT", isActive: true },
  });

  if (students.length !== studentIds.length) {
    throw new ValidationError("Some student IDs are invalid or not active students");
  }

  // Create enrollments (skip duplicates)
  const results = [];
  for (const studentId of studentIds) {
    const existing = await prisma.studentEnrollment.findFirst({
      where: { studentId, practicumClassId: classId },
    });

    if (existing) {
      // Re-activate if dropped
      if (existing.status === "DROPPED") {
        const updated = await prisma.studentEnrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE" },
        });
        results.push(updated);
      }
      continue; // Skip if already active
    }

    const enrollment = await prisma.studentEnrollment.create({
      data: { studentId, practicumClassId: classId },
    });
    results.push(enrollment);
  }

  return results;
}

/**
 * Unenroll a student from a class (soft delete via status change).
 */
export async function unenrollStudent(classId: string, studentId: string) {
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, practicumClassId: classId, status: "ACTIVE" },
  });

  if (!enrollment) throw new NotFoundError("Enrollment");

  return prisma.studentEnrollment.update({
    where: { id: enrollment.id },
    data: { status: "DROPPED" },
  });
}

/**
 * Assign assistants to a class.
 */
export async function assignAssistants(classId: string, assistantIds: string[]) {
  const cls = await prisma.practicumClass.findUnique({ where: { id: classId } });
  if (!cls) throw new NotFoundError("Class", classId);

  const assistants = await prisma.user.findMany({
    where: { id: { in: assistantIds }, role: "ASSISTANT", isActive: true },
  });

  if (assistants.length !== assistantIds.length) {
    throw new ValidationError("Some assistant IDs are invalid or not active assistants");
  }

  const results = [];
  for (const assistantId of assistantIds) {
    const existing = await prisma.assistantAssignment.findFirst({
      where: { assistantId, practicumClassId: classId },
    });

    if (!existing) {
      const assignment = await prisma.assistantAssignment.create({
        data: { assistantId, practicumClassId: classId },
      });
      results.push(assignment);
    }
  }

  return results;
}

/**
 * Unassign an assistant from a class.
 */
export async function unassignAssistant(classId: string, assistantId: string) {
  const assignment = await prisma.assistantAssignment.findFirst({
    where: { assistantId, practicumClassId: classId },
  });

  if (!assignment) throw new NotFoundError("Assistant Assignment");

  await prisma.assistantAssignment.delete({ where: { id: assignment.id } });
}
