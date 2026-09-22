/**
 * ServiceRepository: assigned services and their linked contact products.
 */
import { pool } from "../config/db.js";

const VISIBLE_CONTACT_PRODUCT_CONDITION = `
  (
    cp.license_key IS NULL
    OR NOT (
      cp.license_key REGEXP '^[A-Z0-9]{6}-[0-9]{4}(-[0-9]+)?$'
      AND EXISTS (
        SELECT 1
        FROM quotes q
        JOIN quote_items qi ON qi.quote_id = q.id
        WHERE q.status = 'ACEPTADA'
          AND q.client_id = cp.client_id
          AND q.contact_id = cp.contact_id
          AND qi.product_id = cp.product_id
          AND ABS(TIMESTAMPDIFF(SECOND, q.created_at, cp.created_at)) <= 10
      )
    )
  )
`;

/**
 * Lists contact products that represent services.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getAssignedServices(queryRunner = pool) {
  const [rows] = await queryRunner.query(`
    SELECT
      cp.id AS contact_product_id,
      cp.contact_id,
      cp.client_id,
      cp.license_key,
      cp.start_date,
      cp.expiration_date,
      cp.status,
      p.id AS product_id,
      p.folio AS product_folio,
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
      SELECT cp.id AS contact_product_id
      FROM contact_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE p.product_type = 'SERVICE'
         OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
         OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
    ) sp
    JOIN contact_products cp ON cp.id = sp.contact_product_id
    JOIN products p ON cp.product_id = p.id
    JOIN client_contacts cc ON cp.contact_id = cc.id
    JOIN clients c ON cc.client_id = c.id
    WHERE ${VISIBLE_CONTACT_PRODUCT_CONDITION}
      AND COALESCE(UPPER(TRIM(p.product_type)), '') <> 'POLICY'
    ORDER BY cp.id DESC
  `);
  return rows;
}

/**
 * Lists standalone service products without a visible assignment.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getStandaloneServices(queryRunner = pool) {
  const [rows] = await queryRunner.query(`
    SELECT
      p.id AS product_id,
      p.folio AS product_folio,
      p.name AS product_name,
      p.category AS product_category,
      p.current_price,
      p.product_type,
      p.client_id,
      c.business_name
    FROM products p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE (
      p.product_type = 'SERVICE'
      OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
      OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
    )
    AND COALESCE(UPPER(TRIM(p.product_type)), '') <> 'POLICY'
    AND p.name NOT LIKE '%CONTPAQi%'
    AND p.name NOT LIKE '%CONTPAQI%'
    AND p.id NOT IN (
      SELECT DISTINCT cp.product_id
      FROM contact_products cp
      WHERE ${VISIBLE_CONTACT_PRODUCT_CONDITION}
    )
    ORDER BY p.id DESC
  `);
  return rows;
}

/**
 * Lists legacy assignments when the services table does not exist.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getLegacyAssignedServices(queryRunner = pool) {
  const [rows] = await queryRunner.query(`
    SELECT
      cp.id AS contact_product_id,
      cp.contact_id,
      cp.client_id,
      cp.license_key,
      cp.start_date,
      cp.expiration_date,
      cp.status,
      p.id AS product_id,
      p.folio AS product_folio,
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
    WHERE (
      p.product_type = 'SERVICE'
      OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
      OR LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.name, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) LIKE '%servicio%'
    )
    AND ${VISIBLE_CONTACT_PRODUCT_CONDITION}
    AND COALESCE(UPPER(TRIM(p.product_type)), '') <> 'POLICY'
    ORDER BY cp.id DESC
  `);
  return rows;
}



/**
 * Updates contact product dates and status together with its linked service.
 * @param {number|string} id
 * @param {object} input
 * @param {string} [input.start_date]
 * @param {string} [input.expiration_date]
 * @param {string} [input.status]
 * @param {string} [input.license_key]
 * @returns {Promise<object>} Registro actualizado
 */
export async function updateContactProductDatesTx(id, { start_date, expiration_date, status, license_key }) {
  const connection = await pool.getConnection();
  let txStarted = false;

  try {
    await connection.beginTransaction();
    txStarted = true;

    // Verificar que existe
    const [existingRows] = await connection.query(
      "SELECT id FROM contact_products WHERE id = ?",
      [id]
    );
    if (!existingRows.length) {
      throw new Error("Registro no encontrado");
    }

    const updates = [];
    const values = {};

    if (start_date !== undefined && start_date !== null) {
      updates.push("start_date = :start_date");
      values.start_date = start_date;
    }
    if (expiration_date !== undefined && expiration_date !== null) {
      updates.push("expiration_date = :expiration_date");
      values.expiration_date = expiration_date;
    }
    if (status !== undefined && status !== null) {
      updates.push("status = :status");
      values.status = status;
    }
    if (license_key !== undefined) {
      updates.push("license_key = :license_key");
      values.license_key = license_key?.trim() || null;
    }

    if (updates.length > 0) {
      // 1. contact_products
      await connection.query(
        `UPDATE contact_products SET ${updates.join(", ")} WHERE id = :id`,
        { ...values, id }
      );

      // License keys belong to contact_products; services has its own folio.
      const serviceUpdates = updates.filter((update) => !update.startsWith("license_key"));
      if (serviceUpdates.length > 0) {
        try {
          await connection.query(
            `UPDATE services SET ${serviceUpdates.join(", ")} WHERE contact_product_id = :id`,
            { ...values, id }
          );
        } catch (error) {
          if (error.code !== "ER_NO_SUCH_TABLE") throw error;
        }
      }
    }

    await connection.commit();

    const [rows] = await connection.query(
      `SELECT cp.*, p.name AS product_name, p.category AS product_category
       FROM contact_products cp
       JOIN products p ON cp.product_id = p.id
       WHERE cp.id = ?`,
      [id]
    );

    if (!rows.length) {
      throw new Error("Error obteniendo registro actualizado");
    }

    return rows[0];
  } catch (error) {
    if (txStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}
