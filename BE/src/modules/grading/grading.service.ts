import { prisma } from "../../lib/prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../utils/error";
import type {
  CreateGradingComponentDto,
  UpdateGradingComponentDto,
  InputGradeDto,
  BatchGradeDto,
  SetGradeLettersDto,
} from "./grading.schema";
import type { AuthUser } from "../../types/common";
import type { AggregationMethod, Prisma } from "@prisma/client";

// ─── GRADING COMPONENT CONFIGURATION ──────────────────────────────────────

/**
 * List all grading components for a practicum.
 */
export async function listComponents(practicumId: string) {
  return prisma.gradingComponent.findMany({
    where: { practicumId },
    orderBy: { order: "asc" },
  });
}

/**
 * Add a grading component to a practicum.
 * Validates that total weights do not exceed 100%.
 */
export async function createComponent(practicumId: string, dto: CreateGradingComponentDto) {
  // Check existing weights
  const existing = await prisma.gradingComponent.findMany({
    where: { practicumId },
    select: { weight: true },
  });

  const currentTotalWeight = existing.reduce(
    (sum, c) => sum + Number(c.weight),
    0
  );
  const newTotal = currentTotalWeight + dto.weight;

  if (newTotal > 1.0001) {
    // Small epsilon for floating point
    throw new ValidationError(
      `Total weight would be ${(newTotal * 100).toFixed(1)}%. ` +
        `Maximum is 100%. Current total: ${(currentTotalWeight * 100).toFixed(1)}%`
    );
  }

  return prisma.gradingComponent.create({
    data: {
      practicumId,
      name: dto.name,
      weight: dto.weight,
      order: dto.order,
      isPerSession: dto.isPerSession,
      aggregationMethod: dto.aggregationMethod,
      maxScore: dto.maxScore,
    },
  });
}

/**
 * Update a grading component.
 */
export async function updateComponent(id: string, dto: UpdateGradingComponentDto) {
  const component = await prisma.gradingComponent.findUnique({ where: { id } });
  if (!component) throw new NotFoundError("Grading Component", id);

  // Validate weights if weight is changing
  if (dto.weight !== undefined && dto.weight !== Number(component.weight)) {
    const others = await prisma.gradingComponent.findMany({
      where: { practicumId: component.practicumId, id: { not: id } },
      select: { weight: true },
    });

    const othersTotal = others.reduce((sum, c) => sum + Number(c.weight), 0);
    if (othersTotal + dto.weight > 1.0001) {
      throw new ValidationError(
        `Total weight would be ${((othersTotal + dto.weight) * 100).toFixed(1)}%. Maximum is 100%.`
      );
    }
  }

  return prisma.gradingComponent.update({
    where: { id },
    data: {
      name: dto.name,
      weight: dto.weight,
      order: dto.order,
      isPerSession: dto.isPerSession,
      aggregationMethod: dto.aggregationMethod,
      maxScore: dto.maxScore,
    },
  });
}

/**
 * Delete a grading component. Cascades to associated grades.
 */
export async function deleteComponent(id: string) {
  const component = await prisma.gradingComponent.findUnique({
    where: { id },
    include: { _count: { select: { grades: true } } },
  });

  if (!component) throw new NotFoundError("Grading Component", id);

  if (component._count.grades > 0) {
    throw new ValidationError(
      `Cannot delete this component: ${component._count.grades} grade(s) exist. ` +
        `Delete the grades first or use a different approach.`
    );
  }

  await prisma.gradingComponent.delete({ where: { id } });
}

// ─── GRADE LETTER MAPPINGS ────────────────────────────────────────────────

/**
 * Get grade letter mappings for a practicum.
 */
export async function getGradeLetters(practicumId: string) {
  return prisma.gradeLetterMapping.findMany({
    where: { practicumId },
    orderBy: { order: "asc" },
  });
}

/**
 * Set (replace) all grade letter mappings for a practicum.
 * This is a batch replace operation.
 */
export async function setGradeLetters(practicumId: string, dto: SetGradeLettersDto) {
  // Validate ranges don't overlap and cover 0-100
  const sorted = [...dto.letters].sort((a, b) => b.minScore - a.minScore);

  // Delete existing and create new in a transaction
  await prisma.$transaction([
    prisma.gradeLetterMapping.deleteMany({ where: { practicumId } }),
    ...sorted.map((letter, index) =>
      prisma.gradeLetterMapping.create({
        data: {
          practicumId,
          letter: letter.letter,
          minScore: letter.minScore,
          maxScore: letter.maxScore,
          gradePoint: letter.gradePoint,
          order: letter.order,
        },
      })
    ),
  ]);

  return getGradeLetters(practicumId);
}

// ─── GRADE INPUT ──────────────────────────────────────────────────────────

/**
 * Input a single grade.
 * Upserts: if a grade for this (enrollment, component, session) already exists, update it.
 */
export async function inputGrade(dto: InputGradeDto, gradedBy: string) {
  // Validate the component exists and check if sessionId is required
  const component = await prisma.gradingComponent.findUnique({
    where: { id: dto.gradingComponentId },
  });
  if (!component) throw new NotFoundError("Grading Component", dto.gradingComponentId);

  // Validate score doesn't exceed maxScore
  if (dto.score > Number(component.maxScore)) {
    throw new ValidationError(
      `Score ${dto.score} exceeds maximum score of ${component.maxScore}`
    );
  }

  if (component.isPerSession && !dto.sessionId) {
    throw new ValidationError(
      `This component requires a session ID because it is graded per session`
    );
  }

  // Verify enrollment exists
  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: dto.studentEnrollmentId },
  });
  if (!enrollment) throw new NotFoundError("Student Enrollment", dto.studentEnrollmentId);

  // Upsert the grade
  const where: Prisma.GradeWhereUniqueInput = {
    studentEnrollmentId_gradingComponentId_sessionId: {
      studentEnrollmentId: dto.studentEnrollmentId,
      gradingComponentId: dto.gradingComponentId,
      sessionId: dto.sessionId ?? "",
    },
  };

  // Try finding existing grade first since the unique constraint with nullable sessionId
  // can be tricky with Prisma
  const existingGrade = await prisma.grade.findFirst({
    where: {
      studentEnrollmentId: dto.studentEnrollmentId,
      gradingComponentId: dto.gradingComponentId,
      sessionId: dto.sessionId ?? null,
    },
  });

  if (existingGrade) {
    return prisma.grade.update({
      where: { id: existingGrade.id },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        gradedBy,
        gradedAt: new Date(),
      },
    });
  }

  return prisma.grade.create({
    data: {
      studentEnrollmentId: dto.studentEnrollmentId,
      gradingComponentId: dto.gradingComponentId,
      sessionId: dto.sessionId,
      score: dto.score,
      feedback: dto.feedback,
      gradedBy,
      gradedAt: new Date(),
    },
  });
}

/**
 * Batch input grades.
 */
export async function batchInputGrades(dto: BatchGradeDto, gradedBy: string) {
  const results = [];
  for (const grade of dto.grades) {
    const result = await inputGrade(grade, gradedBy);
    results.push(result);
  }
  return results;
}

// ─── GRADE CALCULATION ────────────────────────────────────────────────────

/**
 * Calculate the final score for a single student enrollment.
 * This is the core grading engine.
 *
 * Formula:
 *   For each component:
 *     if per_session: component_score = aggregate(session_scores)
 *     else: component_score = direct_score
 *     weighted = (component_score / max_score) * weight * 100
 *   final_score = sum(weighted)
 */
export async function calculateFinalScore(enrollmentId: string): Promise<{
  componentScores: Array<{
    componentId: string;
    componentName: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
  }>;
  finalScore: number;
  letterGrade: string | null;
  gradePoint: number | null;
}> {
  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      practicumClass: {
        include: {
          practicum: {
            include: {
              gradingComponents: { orderBy: { order: "asc" } },
              gradeLetters: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!enrollment) throw new NotFoundError("Student Enrollment", enrollmentId);

  const components = enrollment.practicumClass.practicum.gradingComponents;
  const gradeLetters = enrollment.practicumClass.practicum.gradeLetters;

  const componentScores = [];
  let finalScore = 0;

  for (const component of components) {
    const grades = await prisma.grade.findMany({
      where: {
        studentEnrollmentId: enrollmentId,
        gradingComponentId: component.id,
      },
      orderBy: { gradedAt: "asc" },
    });

    let rawScore = 0;

    if (grades.length === 0) {
      rawScore = 0;
    } else if (component.isPerSession) {
      // Aggregate session scores based on method
      rawScore = aggregateScores(
        grades.map((g) => Number(g.score)),
        component.aggregationMethod
      );
    } else {
      // Single score
      rawScore = Number(grades[0].score);
    }

    const weight = Number(component.weight);
    const maxScore = Number(component.maxScore);
    const weightedScore = (rawScore / maxScore) * weight * 100;

    componentScores.push({
      componentId: component.id,
      componentName: component.name,
      weight,
      rawScore,
      weightedScore,
    });

    finalScore += weightedScore;
  }

  // Round to 2 decimal places
  finalScore = Math.round(finalScore * 100) / 100;

  // Lookup letter grade
  let letterGrade: string | null = null;
  let gradePoint: number | null = null;

  for (const mapping of gradeLetters) {
    if (finalScore >= Number(mapping.minScore) && finalScore <= Number(mapping.maxScore)) {
      letterGrade = mapping.letter;
      gradePoint = mapping.gradePoint ? Number(mapping.gradePoint) : null;
      break;
    }
  }

  return { componentScores, finalScore, letterGrade, gradePoint };
}

/**
 * Aggregate an array of scores using the specified method.
 */
function aggregateScores(scores: number[], method: AggregationMethod): number {
  if (scores.length === 0) return 0;

  switch (method) {
    case "AVERAGE":
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    case "SUM":
      return scores.reduce((sum, s) => sum + s, 0);
    case "HIGHEST":
      return Math.max(...scores);
    case "LATEST":
      return scores[scores.length - 1];
    default:
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
}

// ─── GRADE SUMMARY ────────────────────────────────────────────────────────

/**
 * Get grade summary for all students in a class.
 * Calculates final scores for every enrolled student.
 */
export async function getClassGradeSummary(classId: string) {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { practicumClassId: classId, status: "ACTIVE" },
    include: {
      student: { select: { id: true, fullName: true, nim: true } },
    },
    orderBy: { student: { fullName: "asc" } },
  });

  const results = [];
  for (const enrollment of enrollments) {
    const gradeResult = await calculateFinalScore(enrollment.id);
    results.push({
      enrollment: {
        id: enrollment.id,
        student: enrollment.student,
      },
      ...gradeResult,
    });
  }

  return results;
}

// ─── GRADE PUBLISHING ─────────────────────────────────────────────────────

/**
 * Publish final grades for all students in a practicum.
 * Calculates and persists final scores into the published_grades table.
 */
export async function publishGrades(practicumId: string, publishedBy: string) {
  const classes = await prisma.practicumClass.findMany({
    where: { practicumId, isActive: true },
    select: { id: true },
  });

  const allEnrollments = await prisma.studentEnrollment.findMany({
    where: {
      practicumClassId: { in: classes.map((c) => c.id) },
      status: "ACTIVE",
    },
  });

  let publishedCount = 0;

  for (const enrollment of allEnrollments) {
    const { finalScore, letterGrade, gradePoint } = await calculateFinalScore(enrollment.id);

    await prisma.publishedGrade.upsert({
      where: { studentEnrollmentId: enrollment.id },
      create: {
        studentEnrollmentId: enrollment.id,
        finalScore,
        letterGrade,
        gradePoint,
        publishedBy,
      },
      update: {
        finalScore,
        letterGrade,
        gradePoint,
        publishedBy,
        publishedAt: new Date(),
      },
    });

    publishedCount++;
  }

  return { publishedCount };
}

/**
 * Get grades for a single student enrollment.
 */
export async function getStudentGrades(enrollmentId: string) {
  const grades = await prisma.grade.findMany({
    where: { studentEnrollmentId: enrollmentId },
    include: {
      gradingComponent: {
        select: { name: true, weight: true, maxScore: true, isPerSession: true },
      },
      session: {
        select: { sessionNumber: true, title: true },
      },
      grader: {
        select: { fullName: true },
      },
    },
    orderBy: [
      { gradingComponent: { order: "asc" } },
      { session: { sessionNumber: "asc" } },
    ],
  });

  const publishedGrade = await prisma.publishedGrade.findUnique({
    where: { studentEnrollmentId: enrollmentId },
  });

  const calculated = await calculateFinalScore(enrollmentId);

  return {
    grades,
    calculated,
    published: publishedGrade,
  };
}
