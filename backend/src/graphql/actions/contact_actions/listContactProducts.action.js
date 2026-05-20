import { listContactProducts } from "../../../repositories/contact.repository.js";

export async function listContactProductsAction(contact_id) {
  const rows = await listContactProducts(contact_id);

  return rows
    .filter((row) => isServiceOrPolicy(row))
    .map((row) => ({
      id: row.id,
      contact_id: row.contact_id,
      license_key: row.license_key,
      start_date: new Date(row.start_date).toISOString(),
      expiration_date: new Date(row.expiration_date).toISOString(),
      status: determineStatus(row.status, row.expiration_date),
      product: {
        id: row.product_id,
        name: row.product_name,
        category: row.product_category,
        description: row.product_description,
        current_price: row.current_price,
        is_active: Boolean(row.is_active),
        product_type: normalizeProductType(row),
      },
    }));
}

function normalizeProductType(row) {
  const raw = String(row.product_type || "").trim().toUpperCase();
  if (raw === "SERVICE" || raw === "POLICY") return raw;

  const source = `${row.product_name || ""} ${row.product_category || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (source.includes("poliza")) return "POLICY";
  if (source.includes("servicio")) return "SERVICE";
  return "PRODUCT";
}

function isServiceOrPolicy(row) {
  const normalized = normalizeProductType(row);
  return normalized === "SERVICE" || normalized === "POLICY";
}

function determineStatus(storedStatus, expirationDate) {
  const normalizedStatus = String(storedStatus || "")
    .trim()
    .toUpperCase();

  if (normalizedStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (normalizedStatus === "EXPIRED") {
    return "EXPIRED";
  }

  const now = new Date();
  const exp = new Date(expirationDate);
  if (exp < now) {
    return "EXPIRED";
  }
  const diffTime = Math.abs(exp - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 5) {
    return "EXPIRING_SOON";
  }
  return "ACTIVE";
}
