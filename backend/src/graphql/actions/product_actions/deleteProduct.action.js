import { pool } from "../../../config/db.js";

export async function deleteProductAction(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Eliminar historial de precios (FK manual)
    await conn.query(
      "DELETE FROM product_price_history WHERE product_id = :id",
      { id }
    );

    // 2. Eliminar producto físico
    // Nota: Si hay items de polizas, se borrarán por ON DELETE CASCADE definido en init.sql
    await conn.query("DELETE FROM products WHERE id = :id", { id });

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
