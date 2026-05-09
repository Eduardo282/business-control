import { pool } from "../../../config/db.js";

let columnEnsured = false;

async function ensureProductTypeColumn(conn) {
  if (columnEnsured) return;
  try {
    await conn.query(
      `ALTER TABLE products ADD COLUMN product_type VARCHAR(20) DEFAULT 'PRODUCT'`
    );
  } catch (e) {
    // Column already exists — ignore
    if (!e.message.includes("Duplicate column")) throw e;
  }
  columnEnsured = true;
}

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
    await ensureProductTypeColumn(conn);
    await conn.beginTransaction();

    const safeType = ["SERVICE", "POLICY"].includes(product_type) ? product_type : "PRODUCT";

    const [res] = await conn.query(
      `INSERT INTO products (name, category, current_price, description, users_count, client_id, product_type)
       VALUES (:name, :category, :price, :description, :users_count, :client_id, :product_type)`,
      {
        name,
        category,
        price,
        description: description || null,
        users_count: users_count || 0,
        client_id: client_id || null,
        product_type: safeType,
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
