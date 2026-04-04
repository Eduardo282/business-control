import { pool } from "../../../config/db.js";

export async function clearProductPriceHistoryAction(productId) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "DELETE FROM product_price_history WHERE product_id = :id",
      { id: productId }
    );
    return true;
  } catch (e) {
    throw e;
  } finally {
    conn.release();
  }
}
