/**
 * HookZen Strict 28-Day Credit Cycle Utilities
 * Ensures free credits strictly follow a 28-day window and cannot be reset early.
 */

export const CYCLE_DAYS = 28;
export const MAX_FREE_CREDITS = 50;
export const CREDITS_PER_ANALYSIS = 10;

/**
 * Returns current date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Parses YYYY-MM-DD or ISO date string to UTC midnight timestamp
 */
export function parseDateToMidnight(dateStr?: string): number {
  if (!dateStr) return Date.now();
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return Date.UTC(year, month, day);
  }
  const parsed = new Date(dateStr).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * Returns the number of full calendar days passed since lastResetDate
 */
export function getDaysSinceReset(lastResetDateStr?: string): number {
  if (!lastResetDateStr) return 0;
  const startMs = parseDateToMidnight(lastResetDateStr);
  const now = new Date();
  const nowMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Strictly checks if the 28-day cycle has completed and credits are due for reset.
 * Returns true ONLY IF at least 28 days have passed since lastResetDate.
 */
export function isCycleResetDue(lastResetDateStr?: string): boolean {
  if (!lastResetDateStr) return false;
  return getDaysSinceReset(lastResetDateStr) >= CYCLE_DAYS;
}

/**
 * Returns remaining days until next reset (1 to 28).
 */
export function getDaysUntilNextReset(lastResetDateStr?: string): number {
  if (!lastResetDateStr) return CYCLE_DAYS;
  const elapsed = getDaysSinceReset(lastResetDateStr);
  return Math.max(1, CYCLE_DAYS - elapsed);
}
