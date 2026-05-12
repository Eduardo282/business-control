import { pool } from "../../../config/db.js";
import { ensureQuoteItemDiscountColumnsAction } from "./ensureQuoteItemDiscountColumns.action.js";

const IVA_RATE = 0.16;

export const updatePortalQuoteRequestAction = async (quoteId, input, user) => {
  const { items } = input;
  let supportsDiscountColumns = false;

  try {
    supportsDiscountColumns = await ensureQuoteItemDiscountColumnsAction();
  } catch (error) {
    console.warn("No se pudieron asegurar columnas de descuento:", error.message);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify quote ownership and status
    const [quotes] = await connection.query(
      "SELECT id, status FROM quotes WHERE id = ? AND contact_id = ? AND is_deleted_admin = 0",
      [quoteId, user.contactId]
    );

    if (quotes.length === 0) {
      throw new Error("Cotización no encontrada o no tienes permisos para editarla");
    }

    const quote = quotes[0];
    if (quote.status !== "REQUESTED" && quote.status !== "PENDING") {
      throw new Error("Solo puedes editar cotizaciones pendientes o solicitadas");
    }

    // 2. Calculate new totals and prepare items
    let quoteTotal = 0;
    const finalItems = [];

    for (const item of items) {
      const [rows] = await connection.query(
        "SELECT id, name, current_price FROM products WHERE id = ?",
        [item.product_id]
      );
      if (rows.length === 0) {
        throw new Error(`Producto con ID ${item.product_id} no encontrado`);
      }
      const product = rows[0];
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const base_unit_price = Number(product.current_price);
      const discount = 0;
      const unit_price = Number(base_unit_price.toFixed(2));
      const lineTotal = Number((unit_price * quantity).toFixed(2));

      quoteTotal += lineTotal;
      finalItems.push({
        product_id: product.id,
        quantity,
        base_unit_price,
        unit_price,
        discount,
        total: lineTotal,
      });
    }

    quoteTotal = Number(quoteTotal.toFixed(2));
    const quoteIva = Number((quoteTotal * IVA_RATE).toFixed(2));
    const quoteTotalWithIva = Number((quoteTotal + quoteIva).toFixed(2));

    // 3. Delete old items
    await connection.query("DELETE FROM quote_items WHERE quote_id = ?", [quoteId]);

    // 4. Insert new items
    for (const item of finalItems) {
      if (supportsDiscountColumns) {
        await connection.query(
          `INSERT INTO quote_items (quote_id, product_id, quantity, base_unit_price, unit_price, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [quoteId, item.product_id, item.quantity, item.base_unit_price, item.unit_price, item.discount, item.total]
        );
      } else {
        await connection.query(
          `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
          [quoteId, item.product_id, item.quantity, item.unit_price, item.total]
        );
      }
    }

    // 5. Update quote total
    await connection.query("UPDATE quotes SET total = ? WHERE id = ?", [quoteTotalWithIva, quoteId]);

    await connection.commit();

    return {
      id: quoteId,
      total: quoteTotalWithIva,
      subtotal: quoteTotal,
      iva: quoteIva,
      status: quote.status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
