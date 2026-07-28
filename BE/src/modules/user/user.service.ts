import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/hash";
import { ConflictError, NotFoundError } from "../../utils/error";
import { getPrismaPageArgs, getPrismaOrderBy, type PaginationQuery } from "../../lib/pagination";
import type { CreateUserDto, UpdateUserDto, UpdateStatusDto } from "./user.schema";
import type { Prisma, UserRole } from "@prisma/client";

// Fields to select for user responses (never expose passwordHash)
const userSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  nim: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/**
 * List users with pagination, filtering, and search.
 */
export async function listUsers(
  query: PaginationQuery,
  filters?: { role?: UserRole; isActive?: boolean }
) {
  const where: Prisma.UserWhereInput = {};

  if (filters?.role) where.role = filters.role;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  if (query.search) {
    where.OR = [
      { username: { contains: query.search, mode: "insensitive" } },
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { nim: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      ...getPrismaPageArgs(query),
      orderBy: getPrismaOrderBy(query, ["username", "fullName", "role", "createdAt"]),
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

/**
 * Get a single user by ID.
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) throw new NotFoundError("User", id);
  return user;
}

/**
 * Create a new user.
 */
export async function createUser(dto: CreateUserDto) {
  // Determine username
  const username = dto.username || dto.nim;
  if (!username) {
    throw new ConflictError("Username (or NIM for students/assistants) is required");
  }

  // Check for duplicate username
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) throw new ConflictError("A user with this username already exists");

  // Check for duplicate NIM
  if (dto.nim) {
    const existingNim = await prisma.user.findUnique({ where: { nim: dto.nim } });
    if (existingNim) throw new ConflictError("A user with this NIM already exists");
  }

  const passwordHash = await hashPassword(dto.password);

  const user = await prisma.user.create({
    data: {
      username,
      email: dto.email || null,
      passwordHash,
      fullName: dto.fullName,
      nim: dto.nim,
      phone: dto.phone,
      role: dto.role,
    },
    select: userSelect,
  });

  return user;
}

/**
 * Update an existing user.
 */
export async function updateUser(id: string, dto: UpdateUserDto) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("User", id);

  // Check username uniqueness if changing
  if (dto.username && dto.username !== existing.username) {
    const usernameTaken = await prisma.user.findUnique({ where: { username: dto.username } });
    if (usernameTaken) throw new ConflictError("A user with this username already exists");
  }

  // Check NIM uniqueness if changing
  if (dto.nim && dto.nim !== existing.nim) {
    const nimTaken = await prisma.user.findUnique({ where: { nim: dto.nim } });
    if (nimTaken) throw new ConflictError("A user with this NIM already exists");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      username: dto.username,
      email: dto.email === null ? null : dto.email,
      fullName: dto.fullName,
      nim: dto.nim,
      phone: dto.phone,
      role: dto.role,
    },
    select: userSelect,
  });

  return user;
}

/**
 * Activate or deactivate a user.
 */
export async function updateUserStatus(id: string, dto: UpdateStatusDto) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("User", id);

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: dto.isActive },
    select: userSelect,
  });

  return user;
}

/**
 * Soft-delete a user (set isActive to false).
 */
export async function deleteUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("User", id);

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}
