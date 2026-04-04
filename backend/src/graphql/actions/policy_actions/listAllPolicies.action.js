import { pool } from "../../../config/db.js";

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

function mapPolicyRows(rows) {
  return rows.map((row) => ({
    id: row.contact_product_id,
    contact_id: row.contact_id,
    client_id: row.client_id,
    license_key: row.license_key,
    start_date: new Date(row.start_date).toISOString(),
    expiration_date: new Date(row.expiration_date).toISOString(),
    status: determineStatus(row.status, row.expiration_date),
    product: {
      id: row.product_id,
      name: row.product_name,
      category: row.product_category,
      current_price: row.current_price,
    },
    contact: {
      id: row.contact_id,
      client_id: row.client_id,
      full_name: row.contact_name,
      email: row.contact_email,
    },
    client: {
      id: row.client_id,
      business_name: row.business_name,
    },
  }));
}

export async function listAllPoliciesAction() {
  try {
    const [rows] = await pool.query(`
      SELECT
        cp.id AS contact_product_id,
        cp.contact_id,
        cp.client_id,
        cp.license_key,
        cp.start_date,
        cp.expiration_date,
        cp.status,
        p.id AS product_id,
        p.name AS product_name,
        p.category AS product_category,
        p.current_price,
        cc.full_name AS contact_name,
        cc.email AS contact_email,
        c.business_name
      FROM (
        SELECT contact_product_id FROM services
        UNION ALL
        SELECT contact_product_id FROM policies
      ) sp
      JOIN contact_products cp ON cp.id = sp.contact_product_id
      JOIN products p ON cp.product_id = p.id
      JOIN client_contacts cc ON cp.contact_id = cc.id
      JOIN clients c ON cc.client_id = c.id
      ORDER BY cp.id DESC
    `);

    return mapPolicyRows(rows);
  } catch (error) {
    // Fallback para ambientes sin migracion de tablas dedicadas.
    if (error.code !== "ER_NO_SUCH_TABLE") {
      throw error;
    }

    const [legacyRows] = await pool.query(`
      SELECT
        cp.id AS contact_product_id,
        cp.contact_id,
        cp.client_id,
        cp.license_key,
        cp.start_date,
        cp.expiration_date,
        cp.status,
        p.id AS product_id,
        p.name AS product_name,
        p.category AS product_category,
        p.current_price,
        cc.full_name AS contact_name,
        cc.email AS contact_email,
        c.business_name
      FROM contact_products cp
      JOIN products p ON cp.product_id = p.id
      JOIN client_contacts cc ON cp.contact_id = cc.id
      JOIN clients c ON cc.client_id = c.id
      WHERE LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) IN (
        'servicio personalizado',
        'poliza personalizada'
      )
      ORDER BY cp.id DESC
    `);

    return mapPolicyRows(legacyRows);
  }
}
