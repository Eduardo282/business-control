import { pool } from "../../../config/db.js";

export async function deletePortalQuoteAction(id, user) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      "SELECT id, status FROM quotes WHERE id = ? AND contact_id = ?",
      [id, user.contactId]
    );

    if (rows.length === 0) {
      throw new Error("Cotización no encontrada o no tienes permisos para eliminarla");
    }

    const quote = rows[0];
    if (quote.status !== "REQUESTED" && quote.status !== "PENDING") {
      throw new Error("Solo puedes eliminar cotizaciones pendientes o solicitadas");
    }

    const result = await connection.query(
      "UPDATE quotes SET is_deleted_admin = 1 WHERE id = ?",
      [id]
    );
    return result[0].affectedRows > 0;
  } finally {
    connection.release();
  }
}
