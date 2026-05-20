import { pool } from "../../../config/db.js";
import { findPortalQuote, updateQuoteStatus } from "../../../repositories/quote.repository.js";

export async function rejectPortalQuoteAction(id, user) {
  const connection = await pool.getConnection();
  try {
    const quote = await findPortalQuote({
      quoteId: id,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para rechazarla");
    }

    // Permitir rechazar si está solicitada, pendiente o enviada
    if (quote.status !== "REQUESTED" && quote.status !== "PENDING" && quote.status !== "SENT") {
      throw new Error("No se puede rechazar una cotización que ya ha sido aceptada o rechazada");
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
