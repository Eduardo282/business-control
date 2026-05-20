import { pool } from "../../../config/db.js";
import { insertContactProduct } from "../../../repositories/contact.repository.js";
import {
  insertProductFulfillmentRecord,
  resolveProductFulfillmentTarget,
} from "../../../services/productFulfillmentRegistry.service.js";
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

    // 5. Borrar productos (polizas) activos de prueba si se generaron en request (opcional, pero requestQuote no genera polizas)
    //    Sin embargo, createQuoteAction sí genera pólizas AUTOMÁTICAS. Aquí DEBERÍAMOS generarlas también.

    // Generar Pólizas automáticas si hay contacto
    if (contact_id) {
      const startDate = new Date();

      for (const item of finalItems) {
        const expirationDate = new Date(startDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        for (let i = 0; i < item.quantity; i++) {
          const licenseKey =
            Math.random().toString(36).substring(2, 8).toUpperCase() +
            "-" +
            Date.now().toString().substring(9) +
            (i > 0 ? `-${i}` : "");

          const contactProductId = await insertContactProduct({
            client_id,
            contact_id,
            product_id: item.product_id,
            license_key: licenseKey,
            start_date: startDate,
            expiration_date: expirationDate,
            status: "ACTIVE",
          }, connection);

          const target = resolveProductFulfillmentTarget(item);
          await insertProductFulfillmentRecord(connection, target, {
            contact_product_id: contactProductId,
            client_id,
            contact_id,
            product_id: item.product_id,
            folio: licenseKey,
            start_date: startDate,
            expiration_date: expirationDate,
          });
        }
      }
    }

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
