import { pool } from "../../../config/db.js";

export async function createProductAction({
  name,
  category,
  price,
  description,
  users_count,
  client_id,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.query(
      `INSERT INTO products (name, category, current_price, description, users_count, client_id)
       VALUES (:name, :category, :price, :description, :users_count, :client_id)`,
      {
        name,
        category,
        price,
        description: description || null,
        users_count: users_count || 0,
        client_id: client_id || null,
      },
    );
    const productId = res.insertId;

    await conn.query(
      `INSERT INTO product_price_history (product_id, price) VALUES (:id, :price)`,
      { id: productId, price },
    );

    await conn.commit();
    return {
      id: productId,
      name,
      category,
      current_price: price,
      users_count: users_count || 0,
      description,
      client_id,
      price_history: [],
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
