import { pool } from "../../../config/db.js";
import { findQuoteById, updateQuoteStatus } from "../../../repositories/quote.repository.js";

export async function rejectQuoteAction(id) {
  const connection = await pool.getConnection();
  try {
    const quote = await findQuoteById(id, connection);

    if (!quote || quote.is_deleted_admin) {
      throw new Error("Cotización no encontrada");
    }

    // Permitir rechazar si está solicitada o pendiente
    if (quote.status !== "REQUESTED" && quote.status !== "PENDING") {
      throw new Error("Solo se pueden rechazar solicitudes de cotización");
    }

    const affected = await updateQuoteStatus(
      { quoteId: id, status: "REJECTED" },
      connection
    );

    return affected > 0;
  } finally {
    connection.release();
  }
}
