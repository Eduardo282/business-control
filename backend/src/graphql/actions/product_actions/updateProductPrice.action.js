import { pool } from "../../../config/db.js";
import { updateProduct, insertPriceHistory, findProductById } from "../../../repositories/product.repository.js";

export async function updateProductPriceAction(id, newPrice) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await updateProduct(id, { current_price: newPrice }, conn);

    await insertPriceHistory({ product_id: id, price: newPrice }, conn);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return await findProductById(id);
}
