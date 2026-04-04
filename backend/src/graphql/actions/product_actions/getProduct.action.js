import { pool } from "../../../config/db.js";

export async function getProductAction(id) {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = :id", {
    id,
  });
  if (rows.length === 0) return null;
  const p = rows[0];

  // Obtener historial de precios
  const [hist] = await pool.query(
    "SELECT * FROM product_price_history WHERE product_id = :id ORDER BY changed_at DESC",
    { id }
  );

  return {
    ...p,
    price_history: hist,
  };
}
