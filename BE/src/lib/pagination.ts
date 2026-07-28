import { z } from "zod";

/**
 * Standard pagination query parameter schema.
 * Used by all list endpoints.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * Convert pagination query into Prisma skip/take arguments.
 */
export function getPrismaPageArgs(query: PaginationQuery) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}

/**
 * Build Prisma orderBy from sort/order query params.
 * Only allows sorting by whitelisted fields to prevent injection.
 */
export function getPrismaOrderBy(
  query: PaginationQuery,
  allowedFields: string[],
  defaultField = "createdAt"
): Record<string, "asc" | "desc"> {
  const field = query.sort && allowedFields.includes(query.sort)
    ? query.sort
    : defaultField;

  return { [field]: query.order };
}
