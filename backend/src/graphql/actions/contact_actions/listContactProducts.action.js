import { pool } from "../../../config/db.js";

export async function listContactProductsAction(contact_id) {
  const [rows] = await pool.query(
    `SELECT cp.*, 
            p.id as product_id, p.name as product_name, p.category as product_category, p.description as product_description, p.current_price, p.is_active 
     FROM contact_products cp
     JOIN products p ON cp.product_id = p.id
     WHERE cp.contact_id = :contact_id`,
    { contact_id },
  );

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
      current_price: row.current_price,
      is_active: Boolean(row.is_active),
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
  if (diffDays <= 30) {
    return "EXPIRING_SOON";
  }
  return "ACTIVE";
}
