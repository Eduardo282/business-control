import { pool } from "../../../config/db.js";
import { ensureQuoteItemDiscountColumnsAction } from "./ensureQuoteItemDiscountColumns.action.js";

const IVA_RATE = 0.16;

export const createQuoteAction = async (input, user) => {
  const { client_id, contact_id, items, notes, folio: inputFolio } = input;
  let supportsDiscountColumns = false;

  try {
    supportsDiscountColumns = await ensureQuoteItemDiscountColumnsAction();
  } catch (error) {
    console.warn(
      "No se pudieron asegurar columnas de descuento en quote_items:",
      error.message,
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Calcular totales y validar productos
    let quoteTotal = 0;
    const finalItems = [];

    for (const item of items) {
      const [rows] = await connection.query(
        "SELECT id, name, category, current_price FROM products WHERE id = ?",
        [item.product_id],
      );
      if (rows.length === 0) {
        throw new Error(`Producto con ID ${item.product_id} no encontrado`);
      }
      const product = rows[0];
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const inputUnitPrice = Number(item.unit_price);
      const productPrice = Number(product.current_price);
      const basePrice =
        Number.isFinite(inputUnitPrice) && inputUnitPrice > 0 ?
          inputUnitPrice
        : productPrice;
      const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
      const base_unit_price = Number(basePrice.toFixed(2));
      const unit_price = Number(
        (base_unit_price * (1 - discount / 100)).toFixed(2),
      );
      const lineTotal = Number((unit_price * quantity).toFixed(2));

      quoteTotal += lineTotal;
      finalItems.push({
        product_id: product.id,
        product_category: product.category,
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

    // 2. Insertar cotización
    const userId = user.id || user.userId;
    // Use folio from frontend or generate a fallback on the backend
    const folio =
      inputFolio ||
      `COT-GEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const [resQuote] = await connection.query(
      `INSERT INTO quotes (folio, client_id, contact_id, user_id, total, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [folio, client_id, contact_id || null, userId, quoteTotalWithIva, notes],
    );
    const quoteId = resQuote.insertId;

    // 3. Insertar items
    for (const item of finalItems) {
      if (supportsDiscountColumns) {
        await connection.query(
          `INSERT INTO quote_items (quote_id, product_id, quantity, base_unit_price, unit_price, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            quoteId,
            item.product_id,
            item.quantity,
            item.base_unit_price,
            item.unit_price,
            item.discount,
            item.total,
          ],
        );
      } else {
        await connection.query(
          `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
          [
            quoteId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total,
          ],
        );
      }
    }

    await connection.commit();

    // 4. Devolver cotización formateada (estructura básica, los resolvers llenarán las relaciones)
    return {
      id: quoteId,
      folio,
      client_id,
      user_id: userId,
      total: quoteTotalWithIva,
      subtotal: quoteTotal,
      iva: quoteIva,
      status: "PENDING",
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
