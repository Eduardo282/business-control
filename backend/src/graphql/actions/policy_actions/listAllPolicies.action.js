import { pool } from "../../../config/db.js";

let productTypeColumnEnsured = false;

async function ensureProductTypeColumn() {
  if (productTypeColumnEnsured) return;
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM products LIKE 'product_type'");
    if (columns.length === 0) {
      await pool.query(
        "ALTER TABLE products ADD COLUMN product_type VARCHAR(20) DEFAULT 'PRODUCT'"
      );
    }
  } catch (e) {
    console.error("Error ensuring product_type column:", e);
  }
  productTypeColumnEnsured = true;
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

  if (!expirationDate) return normalizedStatus || "ACTIVE";

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
    start_date: row.start_date ? new Date(row.start_date).toISOString() : null,
    expiration_date: row.expiration_date ? new Date(row.expiration_date).toISOString() : null,
    status: determineStatus(row.status, row.expiration_date),
    product: {
      id: row.product_id,
      name: row.product_name,
      category: row.product_category,
      current_price: row.current_price,
      product_type: row.product_type || null,
    },
    contact: row.contact_id ? {
      id: row.contact_id,
      client_id: row.client_id,
      full_name: row.contact_name,
      email: row.contact_email,
    } : null,
    client: row.client_id ? {
      id: row.client_id,
      business_name: row.business_name,
    } : null,
  }));
}

/**
 * Mapea productos "sueltos" (sin contact_product) de tipo servicio/póliza.
 * Se les asigna un id prefijado con "product-" para distinguirlos.
 */
function mapStandaloneProducts(rows) {
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  return rows.map((row) => ({
    id: `product-${row.product_id}`,
    contact_id: null,
    client_id: row.client_id || null,
    license_key: null,
    start_date: now.toISOString(),
    expiration_date: oneYearLater.toISOString(),
    status: "ACTIVE",
    product: {
      id: row.product_id,
      name: row.product_name,
      category: row.product_category,
      current_price: row.current_price,
      product_type: row.product_type || null,
    },
    contact: null,
    client: row.client_id ? {
      id: row.client_id,
      business_name: row.business_name,
    } : null,
  }));
}

export async function listAllPoliciesAction() {
  await ensureProductTypeColumn();
  try {
    // 1) Traer los contact_products que son servicios/pólizas (flujo existente)
    const [cpRows] = await pool.query(`
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
        p.product_type,
        cc.full_name AS contact_name,
        cc.email AS contact_email,
        c.business_name
      FROM (
        SELECT contact_product_id FROM services
        UNION
        SELECT contact_product_id FROM policies
        UNION
        SELECT cp.id AS contact_product_id
        FROM contact_products cp
        JOIN products p ON cp.product_id = p.id
        WHERE p.product_type IN ('SERVICE', 'POLICY')
           OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
           OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
           OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
           OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
      ) sp
      JOIN contact_products cp ON cp.id = sp.contact_product_id
      JOIN products p ON cp.product_id = p.id
      JOIN client_contacts cc ON cp.contact_id = cc.id
      JOIN clients c ON cc.client_id = c.id
      ORDER BY cp.id DESC
    `);

    const assignedResults = mapPolicyRows(cpRows);

    // 2) Traer productos tipo servicio/póliza que NO tienen ningún contact_product
    const [standaloneRows] = await pool.query(`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.category AS product_category,
        p.current_price,
        p.product_type,
        p.client_id,
        c.business_name
      FROM products p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE (
        p.product_type IN ('SERVICE', 'POLICY')
        OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
        OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
        OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
        OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
      )
      AND p.name NOT LIKE '%CONTPAQi%'
      AND p.name NOT LIKE '%CONTPAQI%'
      AND p.id NOT IN (
        SELECT DISTINCT cp.product_id FROM contact_products cp
      )
      ORDER BY p.id DESC
    `);

    const standaloneResults = mapStandaloneProducts(standaloneRows);

    return [...assignedResults, ...standaloneResults];
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
        p.product_type,
        cc.full_name AS contact_name,
        cc.email AS contact_email,
        c.business_name
      FROM contact_products cp
      JOIN products p ON cp.product_id = p.id
      JOIN client_contacts cc ON cp.contact_id = cc.id
      JOIN clients c ON cc.client_id = c.id
      WHERE p.product_type IN ('SERVICE', 'POLICY')
         OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
         OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
         OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
         OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
      ORDER BY cp.id DESC
    `);

    const assignedResults = mapPolicyRows(legacyRows);

    // Also try standalone products in legacy mode
    try {
      const [standaloneRows] = await pool.query(`
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.category AS product_category,
          p.current_price,
          p.product_type,
          p.client_id,
          c.business_name
        FROM products p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE (
          p.product_type IN ('SERVICE', 'POLICY')
          OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
          OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
          OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
          OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%poliza%'
        )
        AND p.name NOT LIKE '%CONTPAQi%'
        AND p.name NOT LIKE '%CONTPAQI%'
        AND p.id NOT IN (
          SELECT DISTINCT cp.product_id FROM contact_products cp
        )
        ORDER BY p.id DESC
      `);
      const standaloneResults = mapStandaloneProducts(standaloneRows);
      return [...assignedResults, ...standaloneResults];
    } catch {
      return assignedResults;
    }
  }
}
