/**
 * Normalize pagination parameters to safe values.
 * @param {{ limit?: number, offset?: number }} params
 * @returns {{ limit: number, offset: number }}
 */
export function normalizePagination({ limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  return { limit: safeLimit, offset: safeOffset };
}
