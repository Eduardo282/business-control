import { pool } from "../../../config/db.js";
import {
  fetchProductsForQuote,
  insertQuoteItems,
  createQuote,
} from "../../../repositories/quote.repository.js";
import { quotePricingService } from "../../../services/quotePricing.service.js";

export const requestQuoteAction = async (input, user) => {
  // User is the contact here
  const { items } = input;
  const client_id = user.clientId;
  const contact_id = user.contactId;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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

    const quoteId = await createQuote({
      client_id,
      contact_id,
      total: pricing.total,
      notes: "Solicitud de cotización desde Portal de Contacto",
      status: "REQUESTED",
      is_sent_to_client_portal: 1,
    }, connection);

    await insertQuoteItems(connection, { quoteId, items: pricing.items });

    await connection.commit();

    return {
      id: quoteId,
      client_id,
      contact_id,
      user_id: null,
      total: pricing.total,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: "REQUESTED",
      notes: "Solicitud desde portal",
      created_at: new Date(),
      items: pricing.items,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
