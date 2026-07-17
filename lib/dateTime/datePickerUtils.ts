/** Parse YYYY-MM-DD into local Date (noon to avoid DST edge cases). */
export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Format Date as YYYY-MM-DD in local timezone. */
export function formatIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isIsoDateInRange(value: string, min?: string, max?: string): boolean {
  if (min && compareIsoDates(value, min) < 0) return false;
  if (max && compareIsoDates(value, max) > 0) return false;
  return true;
}
