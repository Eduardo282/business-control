import { pool } from "../../../config/db.js";
import {
  findPortalQuote,
  softDeletePortalQuote,
} from "../../../repositories/quote.repository.js";

export async function deletePortalQuoteAction(id, user) {
  const connection = await pool.getConnection();
  try {
    const quote = await findPortalQuote({
      quoteId: id,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para eliminarla");
    }

    const affected = await softDeletePortalQuote({ quoteId: id, queryRunner: connection });
    return affected > 0;
  } finally {
    connection.release();
  }
}
