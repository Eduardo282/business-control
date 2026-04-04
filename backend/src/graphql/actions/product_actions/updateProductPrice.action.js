import { pool } from "../../../config/db.js";
import { getProductAction } from "./getProduct.action.js";

export async function updateProductPriceAction(id, newPrice) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE products SET current_price = :price WHERE id = :id",
      { id, price: newPrice }
    );

    await conn.query(
      "INSERT INTO product_price_history (product_id, price) VALUES (:id, :price)",
      { id, price: newPrice }
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return getProductAction(id);
}
