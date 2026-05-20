import { pool } from "../../../config/db.js";
import { insertPriceHistory, insertProduct } from "../../../repositories/product.repository.js";

export async function createProductAction({
  name,
  category,
  price,
  description,
  users_count,
  client_id,
  product_type,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const safeType = ["SERVICE", "POLICY"].includes(product_type) ? product_type : "PRODUCT";

    const productId = await insertProduct(
      {
        name,
        category,
        current_price: price,
        description: description || null,
        users_count: users_count || 0,
        client_id: client_id || null,
        product_type: safeType,
      },
      conn,
    );

    await insertPriceHistory({ product_id: productId, price }, conn);

    await conn.commit();
    return {
      id: productId,
      name,
      category,
      current_price: price,
      users_count: users_count || 0,
      description,
      client_id,
      product_type: safeType,
      price_history: [],
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
