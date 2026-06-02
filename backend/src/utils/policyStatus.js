export function determineStatus(storedStatus, expirationDate) {
  const normalized = String(storedStatus || "").trim().toUpperCase();

  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (!expirationDate) return normalized || "ACTIVE";

  const now = new Date();
  const expiration = new Date(expirationDate);
  if (expiration < now) return "EXPIRED";

  const diffDays = Math.ceil(Math.abs(expiration - now) / (1000 * 60 * 60 * 24));
  return diffDays <= 5 ? "EXPIRING_SOON" : "ACTIVE";
}

export function normalizeProductType(row = {}) {
  const raw = String(row.product_type || "").trim().toUpperCase();
  if (raw === "SERVICE" || raw === "POLICY") return raw;

  const source = `${row.product_name || row.name || ""} ${row.product_category || row.category || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (source.includes("poliza")) return "POLICY";
  if (source.includes("servicio")) return "SERVICE";
  return "PRODUCT";
}

export function isServiceOrPolicy(row = {}) {
  const normalized = normalizeProductType(row);
  return normalized === "SERVICE" || normalized === "POLICY";
}
