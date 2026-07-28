import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seed...");

  const adminPasswordHash = await bcrypt.hash("Admin@123", 12);
  const userPasswordHash = await bcrypt.hash("Password123!", 12);

  // 1. Create System Admin (SYSTEM_ADMIN)
  const systemAdmin = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      fullName: "System Administrator",
      email: "admin@university.ac.id",
      passwordHash: adminPasswordHash,
      role: "SYSTEM_ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ System Admin seeded: @${systemAdmin.username}`);

  // 2. Create Laboratory Admin (LAB_ADMIN)
  const labAdmin = await prisma.user.upsert({
    where: { username: "labfisika" },
    update: {},
    create: {
      username: "labfisika",
      fullName: "Laboran Fisika",
      email: "lab.fisika@university.ac.id",
      passwordHash: adminPasswordHash,
      role: "LAB_ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Lab Admin seeded: @${labAdmin.username}`);

  // 3. Create Sample Laboratory
  const physicsLab = await prisma.laboratory.upsert({
    where: { code: "LAB-FIS" },
    update: { adminId: labAdmin.id },
    create: {
      code: "LAB-FIS",
      name: "Basic Physics Laboratory",
      description: "Laboratory facility for fundamental physics experiments and measurements",
      adminId: labAdmin.id,
      isActive: true,
    },
  });
  console.log(`✅ Laboratory seeded: ${physicsLab.name} (${physicsLab.code})`);

  // 4. Create Assistant / Asprak (ASSISTANT) - Username = NIM
  const assistant = await prisma.user.upsert({
    where: { username: "211511087" },
    update: {},
    create: {
      username: "211511087",
      nim: "211511087",
      fullName: "Asep Asprak",
      email: "asep.asprak@student.university.ac.id",
      passwordHash: userPasswordHash,
      role: "ASSISTANT",
      isActive: true,
    },
  });
  console.log(`✅ Assistant (Asprak) seeded: @${assistant.username} (${assistant.fullName})`);

  // 5. Create Student / Praktikan (STUDENT) - Username = NIM
  const student = await prisma.user.upsert({
    where: { username: "221511001" },
    update: {},
    create: {
      username: "221511001",
      nim: "221511001",
      fullName: "Budi Praktikan",
      email: "budi.praktikan@student.university.ac.id",
      passwordHash: userPasswordHash,
      role: "STUDENT",
      isActive: true,
    },
  });
  console.log(`✅ Student (Praktikan) seeded: @${student.username} (${student.fullName})`);

  // 6. Create Sample Practicum Course
  const practicum = await prisma.practicum.upsert({
    where: {
      code_academicYear_semester: {
        code: "FIS-101",
        academicYear: "2026/2027",
        semester: "ODD",
      },
    },
    update: {},
    create: {
      code: "FIS-101",
      name: "Basic Physics Practicum I",
      description: "Introductory physics mechanics, thermodynamics, and optics experiments",
      academicYear: "2026/2027",
      semester: "ODD",
      totalSessions: 14,
      laboratoryId: physicsLab.id,
      isActive: true,
    },
  });
  console.log(`✅ Practicum seeded: ${practicum.name} (${practicum.code})`);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
