/**
 * PolicyRepository — Puerto de datos para la entidad Policy/Service.
 * Centraliza las consultas, inserciones y actualizaciones de productos asignados (contact_products) y tablas vinculadas (services, policies).
 */
import { pool } from "../config/db.js";

/**
 * Obtiene los contact_products que son servicios/pólizas.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getAssignedPolicies(queryRunner = pool) {
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
  return rows;
}

/**
 * Obtiene los productos tipo servicio/póliza que no tienen ningún contact_product.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getStandalonePolicies(queryRunner = pool) {
  const [rows] = await queryRunner.query(`
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
  return rows;
}

/**
 * Obtiene los contact_products en modo legacy (cuando no hay tablas services/policies).
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getLegacyAssignedPolicies(queryRunner = pool) {
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
  return rows;
}

/**
 * Obtiene un contact_product por su ID.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findContactProductById(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT id, product_id FROM contact_products WHERE id = ?",
    [id]
  );
  return rows?.[0] || null;
}

/**
 * Actualiza un registro de contact_product.
 * @param {number|string} id
 * @param {string[]} updates
 * @param {object} values
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateContactProduct(id, updates, values, queryRunner = pool) {
  await queryRunner.query(
    `UPDATE contact_products SET ${updates.join(", ")} WHERE id = :id`,
    { ...values, id }
  );
}

/**
 * Intenta actualizar en la tabla services.
 * @param {number|string} id
 * @param {string[]} updates
 * @param {object} values
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateServiceDates(id, updates, values, queryRunner = pool) {
  await queryRunner.query(
    `UPDATE services SET ${updates.join(", ")} WHERE contact_product_id = :id`,
    { ...values, id }
  );
}

/**
 * Intenta actualizar en la tabla policies.
 * @param {number|string} id
 * @param {string[]} updates
 * @param {object} values
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updatePolicyDates(id, updates, values, queryRunner = pool) {
  await queryRunner.query(
    `UPDATE policies SET ${updates.join(", ")} WHERE contact_product_id = :id`,
    { ...values, id }
  );
}

/**
 * Obtiene el contact_product actualizado con información del producto.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function getUpdatedPolicyRow(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT cp.*, p.name AS product_name, p.category AS product_category
     FROM contact_products cp
     JOIN products p ON cp.product_id = p.id
     WHERE cp.id = ?`,
    [id]
  );
  return rows?.[0] || null;
}

/**
 * Actualiza la vigencia y el estado de un contact_product y sus tablas vinculadas (services, policies) de manera transaccional.
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

      // 2. services
      try {
        await connection.query(
          `UPDATE services SET ${updates.join(", ")} WHERE contact_product_id = :id`,
          { ...values, id }
        );
      } catch { /* tabla services puede no existir */ }

      // 3. policies
      try {
        await connection.query(
          `UPDATE policies SET ${updates.join(", ")} WHERE contact_product_id = :id`,
          { ...values, id }
        );
      } catch { /* tabla policies puede no existir */ }
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

