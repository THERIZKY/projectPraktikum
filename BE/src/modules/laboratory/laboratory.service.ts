import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/error";
import { getPrismaPageArgs, getPrismaOrderBy, type PaginationQuery } from "../../lib/pagination";
import type { CreateLabDto, UpdateLabDto, AssignAdminDto } from "./laboratory.schema";
import type { Prisma } from "@prisma/client";

const labSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  admin: {
    select: { id: true, fullName: true, email: true },
  },
} satisfies Prisma.LaboratorySelect;

export async function listLaboratories(query: PaginationQuery) {
  const where: Prisma.LaboratoryWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [labs, total] = await Promise.all([
    prisma.laboratory.findMany({
      where,
      select: labSelect,
      ...getPrismaPageArgs(query),
      orderBy: getPrismaOrderBy(query, ["name", "code", "createdAt"]),
    }),
    prisma.laboratory.count({ where }),
  ]);

  return { labs, total };
}

export async function getLabById(id: string) {
  const lab = await prisma.laboratory.findUnique({
    where: { id },
    select: {
      ...labSelect,
      practicums: {
        where: { isActive: true },
        select: { id: true, name: true, code: true, academicYear: true, semester: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lab) throw new NotFoundError("Laboratory", id);
  return lab;
}

export async function createLab(dto: CreateLabDto) {
  const existing = await prisma.laboratory.findUnique({ where: { code: dto.code } });
  if (existing) throw new ConflictError("A laboratory with this code already exists");

  if (dto.adminId) {
    const admin = await prisma.user.findUnique({ where: { id: dto.adminId } });
    if (!admin || admin.role !== "LAB_ADMIN") {
      throw new ValidationError("Admin user must exist and have the LAB_ADMIN role");
    }
  }

  return prisma.laboratory.create({
    data: {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      adminId: dto.adminId,
    },
    select: labSelect,
  });
}

export async function updateLab(id: string, dto: UpdateLabDto) {
  const existing = await prisma.laboratory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Laboratory", id);

  if (dto.code && dto.code !== existing.code) {
    const codeTaken = await prisma.laboratory.findUnique({ where: { code: dto.code } });
    if (codeTaken) throw new ConflictError("A laboratory with this code already exists");
  }

  return prisma.laboratory.update({
    where: { id },
    data: { name: dto.name, code: dto.code, description: dto.description },
    select: labSelect,
  });
}

export async function assignAdmin(id: string, dto: AssignAdminDto) {
  const existing = await prisma.laboratory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Laboratory", id);

  if (dto.adminId) {
    const admin = await prisma.user.findUnique({ where: { id: dto.adminId } });
    if (!admin || admin.role !== "LAB_ADMIN") {
      throw new ValidationError("Admin user must exist and have the LAB_ADMIN role");
    }
  }

  return prisma.laboratory.update({
    where: { id },
    data: { adminId: dto.adminId },
    select: labSelect,
  });
}

export async function deleteLab(id: string) {
  const existing = await prisma.laboratory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Laboratory", id);

  await prisma.laboratory.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Get the laboratory managed by a specific Lab Admin.
 */
export async function getLabByAdminId(adminId: string) {
  return prisma.laboratory.findFirst({
    where: { adminId, isActive: true },
    select: labSelect,
  });
}
