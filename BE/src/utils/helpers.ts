import dayjs from "dayjs";

/**
 * Parse a duration string (e.g., "15m", "7d", "1h") to milliseconds.
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default:  throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Calculate late penalty based on assignment configuration.
 * Returns the penalty percentage (0–maxPenalty).
 */
export function calculateLatePenalty(params: {
  deadline: Date;
  submittedAt: Date;
  penaltyPercentage: number;
  penaltyUnit: "PER_HOUR" | "PER_DAY" | "FLAT";
  maxPenalty: number;
}): number {
  const { deadline, submittedAt, penaltyPercentage, penaltyUnit, maxPenalty } = params;

  if (submittedAt <= deadline) return 0;

  const diffMs = submittedAt.getTime() - deadline.getTime();

  let unitsLate: number;
  switch (penaltyUnit) {
    case "PER_HOUR":
      unitsLate = Math.ceil(diffMs / (1000 * 60 * 60));
      break;
    case "PER_DAY":
      unitsLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      break;
    case "FLAT":
      unitsLate = 1;
      break;
  }

  const penalty = unitsLate * penaltyPercentage;
  return Math.min(penalty, maxPenalty);
}

/**
 * Format a date for display.
 */
export function formatDate(date: Date, format = "YYYY-MM-DD HH:mm:ss"): string {
  return dayjs(date).format(format);
}

/**
 * Sanitize a file name: remove special characters, keep extension.
 */
export function sanitizeFileName(fileName: string): string {
  const ext = fileName.lastIndexOf(".") > 0
    ? fileName.slice(fileName.lastIndexOf("."))
    : "";
  const name = fileName.slice(0, fileName.length - ext.length);
  const sanitized = name.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
  return `${sanitized}${ext}`;
}
