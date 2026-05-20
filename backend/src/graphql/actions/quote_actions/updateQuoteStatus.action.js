import { pool } from "../../../config/db.js";
import { findQuoteById, updateQuoteStatus } from "../../../repositories/quote.repository.js";

export async function updateQuoteStatusAction(id, status) {
  const connection = await pool.getConnection();
  try {
    const validStatuses = ["REQUESTED", "PENDING", "SENT", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      throw new Error("Estado no válido");
    }

    const affected = await updateQuoteStatus(
      { quoteId: id, status },
      connection
    );

    if (affected === 0) {
      throw new Error("Cotización no encontrada");
    }

    return await findQuoteById(id, connection);
  } finally {
    connection.release();
  }
}
