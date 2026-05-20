import { pool } from "../../../config/db.js";
import {
  fetchProductsForQuote,
  findPortalQuote,
  replaceQuoteItems,
  updateQuoteTotal,
} from "../../../repositories/quote.repository.js";
import { quotePricingService } from "../../../services/quotePricing.service.js";

export const updatePortalQuoteRequestAction = async (quoteId, input, user) => {
  const { items } = input;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify quote ownership and status
    const quote = await findPortalQuote({
      quoteId,
      contactId: user.contactId,
      queryRunner: connection,
    });

    if (!quote) {
      throw new Error("Cotización no encontrada o no tienes permisos para editarla");
    }
    if (quote.status !== "REQUESTED" && quote.status !== "PENDING") {
      throw new Error("Solo puedes editar cotizaciones pendientes o solicitadas");
    }

    const productIds = items.map((item) => item.product_id);
    const products = await fetchProductsForQuote(productIds, connection);
    const pricing = quotePricingService.calculate({
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        discount: 0,
      })),
      products,
    });

    await replaceQuoteItems(connection, {
      quoteId,
      items: pricing.items,
    });

    // 5. Update quote total
    await updateQuoteTotal({ quoteId, total: pricing.total, queryRunner: connection });

    await connection.commit();

    return {
      id: quoteId,
      total: pricing.total,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: quote.status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
