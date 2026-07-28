import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../utils/error";
import type { CreateSessionDto, UpdateSessionDto } from "./session.schema";
import type { Prisma } from "@prisma/client";

const sessionSelect = {
  id: true,
  sessionNumber: true,
  title: true,
  description: true,
  date: true,
  startTime: true,
  endTime: true,
  status: true,
  assistantNotes: true,
  createdAt: true,
  _count: {
    select: {
      materials: true,
      assignments: true,
      attendances: true,
      grades: true,
    },
  },
} satisfies Prisma.SessionSelect;

export async function listSessions(classId: string) {
  return prisma.session.findMany({
    where: { practicumClassId: classId },
    select: sessionSelect,
    orderBy: { sessionNumber: "asc" },
  });
}

export async function getSessionById(id: string) {
  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      ...sessionSelect,
      materials: {
        select: { id: true, title: true, fileName: true, fileSize: true, fileType: true, createdAt: true },
      },
      assignments: {
        select: { id: true, title: true, type: true, deadline: true },
      },
    },
  });

  if (!session) throw new NotFoundError("Session", id);
  return session;
}

export async function createSession(classId: string, dto: CreateSessionDto) {
  const existing = await prisma.session.findFirst({
    where: { practicumClassId: classId, sessionNumber: dto.sessionNumber },
  });
  if (existing) throw new ConflictError(`Session ${dto.sessionNumber} already exists`);

  return prisma.session.create({
    data: {
      practicumClassId: classId,
      sessionNumber: dto.sessionNumber,
      title: dto.title,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : undefined,
      startTime: dto.startTime,
      endTime: dto.endTime,
    },
    select: sessionSelect,
  });
}

/**
 * Bulk create all sessions for a class based on totalSessions from practicum.
 */
export async function bulkCreateSessions(classId: string) {
  const cls = await prisma.practicumClass.findUnique({
    where: { id: classId },
    include: { practicum: { select: { totalSessions: true } } },
  });

  if (!cls) throw new NotFoundError("Class", classId);

  const existingSessions = await prisma.session.findMany({
    where: { practicumClassId: classId },
    select: { sessionNumber: true },
  });
  const existingNumbers = new Set(existingSessions.map((s) => s.sessionNumber));

  const sessionsToCreate = [];
  for (let i = 1; i <= cls.practicum.totalSessions; i++) {
    if (!existingNumbers.has(i)) {
      sessionsToCreate.push({
        practicumClassId: classId,
        sessionNumber: i,
        title: `Meeting ${i}`,
      });
    }
  }

  if (sessionsToCreate.length === 0) {
    return { created: 0, message: "All sessions already exist" };
  }

  await prisma.session.createMany({ data: sessionsToCreate });

  return { created: sessionsToCreate.length };
}

export async function updateSession(id: string, dto: UpdateSessionDto) {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Session", id);

  return prisma.session.update({
    where: { id },
    data: {
      title: dto.title,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : dto.date === null ? null : undefined,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status,
      assistantNotes: dto.assistantNotes,
    },
    select: sessionSelect,
  });
}

export async function deleteSession(id: string) {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Session", id);

  await prisma.session.delete({ where: { id } });
}
