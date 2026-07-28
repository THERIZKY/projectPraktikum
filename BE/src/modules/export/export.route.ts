import Elysia from "elysia";
import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { labAdminOrAbove } from "../../middleware/rbac.middleware";
import * as gradingService from "../grading/grading.service";
import { NotFoundError } from "../../utils/error";

export const exportRoutes = new Elysia({ prefix: "/practicums/:id/export" })
  .use(authMiddleware)
  .use(labAdminOrAbove())

  // ─── Export Grades to Excel ─────────────────────────────────────────
  .get("/grades", async ({ params, query, set }) => {
    const practicum = await prisma.practicum.findUnique({
      where: { id: params.id },
      include: {
        gradingComponents: { orderBy: { order: "asc" } },
        classes: {
          where: { isActive: true },
          include: {
            studentEnrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: { select: { fullName: true, nim: true } },
              },
              orderBy: { student: { fullName: "asc" } },
            },
          },
        },
      },
    });

    if (!practicum) throw new NotFoundError("Practicum", params.id);

    const classId = query.classId as string | undefined;
    const classes = classId
      ? practicum.classes.filter((c) => c.id === classId)
      : practicum.classes;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Practicum Management System";
    workbook.created = new Date();

    for (const cls of classes) {
      const sheet = workbook.addWorksheet(cls.name);

      // Header row
      const headerRow = ["No", "NIM", "Student Name"];
      for (const component of practicum.gradingComponents) {
        headerRow.push(`${component.name} (${(Number(component.weight) * 100).toFixed(0)}%)`);
      }
      headerRow.push("Final Score", "Letter Grade");

      sheet.addRow(headerRow);

      // Style header
      const header = sheet.getRow(1);
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };

      // Data rows
      let rowNum = 1;
      for (const enrollment of cls.studentEnrollments) {
        const gradeResult = await gradingService.calculateFinalScore(enrollment.id);

        const row: (string | number)[] = [
          rowNum++,
          enrollment.student.nim || "",
          enrollment.student.fullName,
        ];

        for (const component of practicum.gradingComponents) {
          const componentScore = gradeResult.componentScores.find(
            (c) => c.componentId === component.id
          );
          row.push(componentScore?.rawScore ?? 0);
        }

        row.push(gradeResult.finalScore);
        row.push(gradeResult.letterGrade || "-");

        sheet.addRow(row);
      }

      // Auto-width columns
      sheet.columns.forEach((column) => {
        if (column.values) {
          let maxLength = 10;
          column.values.forEach((val) => {
            if (val) {
              const length = String(val).length;
              if (length > maxLength) maxLength = length;
            }
          });
          column.width = Math.min(maxLength + 2, 40);
        }
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    const fileName = `grades_${practicum.code}_${practicum.academicYear.replace("/", "-")}.xlsx`;
    set.headers["content-type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    set.headers["content-disposition"] = `attachment; filename="${fileName}"`;

    return buffer;
  })

  // ─── Export Attendance to Excel ─────────────────────────────────────
  .get("/attendance", async ({ params, query, set }) => {
    const practicum = await prisma.practicum.findUnique({
      where: { id: params.id },
      include: {
        classes: {
          where: { isActive: true },
          include: {
            sessions: { orderBy: { sessionNumber: "asc" } },
            studentEnrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: { select: { fullName: true, nim: true } },
                attendances: true,
              },
              orderBy: { student: { fullName: "asc" } },
            },
          },
        },
      },
    });

    if (!practicum) throw new NotFoundError("Practicum", params.id);

    const workbook = new ExcelJS.Workbook();

    for (const cls of practicum.classes) {
      const sheet = workbook.addWorksheet(cls.name);

      const headerRow = ["No", "NIM", "Student Name"];
      for (const session of cls.sessions) {
        headerRow.push(`M${session.sessionNumber}`);
      }
      headerRow.push("Present", "Absent", "Late", "Excused", "Rate");

      sheet.addRow(headerRow);
      const header = sheet.getRow(1);
      header.font = { bold: true };

      let rowNum = 1;
      for (const enrollment of cls.studentEnrollments) {
        const row: (string | number)[] = [
          rowNum++,
          enrollment.student.nim || "",
          enrollment.student.fullName,
        ];

        let present = 0, absent = 0, late = 0, excused = 0;

        for (const session of cls.sessions) {
          const att = enrollment.attendances.find((a) => a.sessionId === session.id);
          const status = att?.status || "-";
          row.push(status === "PRESENT" ? "✓" : status === "ABSENT" ? "✗" : status === "LATE" ? "L" : status === "EXCUSED" ? "E" : "-");

          if (status === "PRESENT") present++;
          else if (status === "ABSENT") absent++;
          else if (status === "LATE") late++;
          else if (status === "EXCUSED") excused++;
        }

        const totalSessions = cls.sessions.length;
        const rate = totalSessions > 0 ? ((present + late) / totalSessions * 100).toFixed(1) + "%" : "0%";

        row.push(present, absent, late, excused, rate);
        sheet.addRow(row);
      }

      sheet.columns.forEach((column) => {
        column.width = 12;
      });
      if (sheet.columns[2]) sheet.columns[2].width = 25;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `attendance_${practicum.code}_${practicum.academicYear.replace("/", "-")}.xlsx`;
    set.headers["content-type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    set.headers["content-disposition"] = `attachment; filename="${fileName}"`;

    return buffer;
  });
