import { listClientProducts } from "../../../repositories/client.repository.js";

export async function listClientProductsAction(client_id) {
  const rows = await listClientProducts(client_id);

  return rows.map((row) => ({
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
    },
  }));
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
