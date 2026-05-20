import { pool } from "../../../config/db.js";
import {
  fetchProductsForQuote,
  findQuoteByStatus,
  replaceQuoteItems,
  resolveQuoteRequest,
} from "../../../repositories/quote.repository.js";
import { quotePricingService } from "../../../services/quotePricing.service.js";

export const resolveQuoteRequestAction = async (requestId, input, user) => {
  const { client_id, contact_id, items, notes, folio: inputFolio } = input;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar que la solicitud exista
    const existing = await findQuoteByStatus({
      quoteId: requestId,
      status: "REQUESTED",
      queryRunner: connection,
    });
    if (!existing) {
      throw new Error("Solicitud no válida o ya procesada");
    }

    const productIds = items.map((item) => item.product_id);
    const products = await fetchProductsForQuote(productIds, connection);
    const pricing = quotePricingService.calculate({ items, products });
    const finalItems = pricing.items;

    // 3. Actualizar la cotización existente (REQUESTED -> PENDING) y asignar usuario admin
    const userId = user.id || user.userId;
    const folio =
      inputFolio ||
      `COT-GEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await resolveQuoteRequest({
      quoteId: requestId,
      folio,
      client_id,
      contact_id: contact_id || null,
      user_id: userId,
      total: pricing.total,
      notes,
      queryRunner: connection,
    });

    await replaceQuoteItems(connection, {
      quoteId: requestId,
      items: finalItems,
    });

    await connection.commit();

    return {
      id: requestId,
      folio,
      client_id,
      user_id: userId,
      total: pricing.total,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: "ACCEPTED",
      notes,
      created_at: new Date(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
