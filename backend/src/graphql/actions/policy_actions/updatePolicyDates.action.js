import { pool } from "../../../config/db.js";

const ALLOWED_STATUS = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  return ALLOWED_STATUS.has(normalized) ? normalized : "ACTIVE";
}

/**
 * Actualiza vigencia y estado de un contact_product existente.
 * Si el ID empieza con "product-", significa que es un producto suelto
 * sin contact_product y no se puede actualizar por este medio.
 */
export async function updateContactProductDatesAction(id, { start_date, expiration_date, status }) {
  // Verificar que no sea un producto "suelto" (sin contact_product)
  if (String(id).startsWith("product-")) {
    throw new Error("Este servicio/póliza aún no tiene asignación. Asígnelo a un contacto primero para editar su vigencia.");
  }

  const connection = await pool.getConnection();
  let txStarted = false;

  try {
    await connection.beginTransaction();
    txStarted = true;

    // Verificar que el contact_product existe
    const [existing] = await connection.query(
      "SELECT id, product_id FROM contact_products WHERE id = ?",
      [id]
    );
    if (existing.length === 0) throw new Error("Registro no encontrado");

    // Construir UPDATE dinámicamente
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
      const normalizedStatus = normalizeStatus(status);
      updates.push("status = :status");
      values.status = normalizedStatus;
    }

    if (updates.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    values.id = id;

    await connection.query(
      `UPDATE contact_products SET ${updates.join(", ")} WHERE id = :id`,
      values
    );

    // Actualizar también en tablas services/policies si existen
    try {
      await connection.query(
        `UPDATE services SET ${updates.map(u => u).join(", ")} WHERE contact_product_id = :id`,
        values
      );
    } catch { /* tabla puede no existir */ }

    try {
      await connection.query(
        `UPDATE policies SET ${updates.map(u => u).join(", ")} WHERE contact_product_id = :id`,
        values
      );
    } catch { /* tabla puede no existir */ }

    await connection.commit();

    // Retornar registro actualizado
    const [updated] = await pool.query(
      `SELECT cp.*, p.name AS product_name, p.category AS product_category
       FROM contact_products cp
       JOIN products p ON cp.product_id = p.id
       WHERE cp.id = ?`,
      [id]
    );

    if (updated.length === 0) throw new Error("Error obteniendo registro actualizado");

    const row = updated[0];
    return {
      id: row.id,
      contact_id: row.contact_id,
      client_id: row.client_id,
      license_key: row.license_key,
      start_date: row.start_date ? new Date(row.start_date).toISOString() : null,
      expiration_date: row.expiration_date ? new Date(row.expiration_date).toISOString() : null,
      status: row.status,
      product: {
        id: row.product_id,
        name: row.product_name,
        category: row.product_category,
      },
    };
  } catch (error) {
    if (txStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}
