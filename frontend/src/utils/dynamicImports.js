/**
 * Utility for dynamic imports to reduce duplication and centralize lazy loading logic.
 */

export async function loadXlsx() {
  return await import("xlsx");
}
