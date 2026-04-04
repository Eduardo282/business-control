import { pool } from "../../../config/db.js";
import { ensureQuoteItemDiscountColumnsAction } from "./ensureQuoteItemDiscountColumns.action.js";

export const getQuoteItemsAction = async (quote_id) => {
  let supportsDiscountColumns = false;

  try {
    supportsDiscountColumns = await ensureQuoteItemDiscountColumnsAction();
  } catch (error) {
    console.warn(
      "No se pudieron asegurar columnas de descuento en quote_items:",
      error.message,
    );
  }

  const [rows] =
    supportsDiscountColumns ?
      await pool.query(
        `SELECT
           qi.*,
           COALESCE(qi.base_unit_price, qi.unit_price) AS base_unit_price,
           COALESCE(qi.discount, 0) AS discount
         FROM quote_items qi
         WHERE qi.quote_id = ?`,
        [quote_id],
      )
    : await pool.query(
        `SELECT
           qi.*,
           qi.unit_price AS base_unit_price,
           0 AS discount
         FROM quote_items qi
         WHERE qi.quote_id = ?`,
        [quote_id],
      );

  return rows;
};
