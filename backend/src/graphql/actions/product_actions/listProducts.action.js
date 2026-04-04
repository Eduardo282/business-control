import { pool } from "../../../config/db.js";

export async function listProductsAction({ client_id } = {}) {
  let query = "SELECT * FROM products";
  const params = {};

  if (client_id) {
    // Mostrar productos globales O productos para este cliente
    query += " WHERE client_id IS NULL OR client_id = :client_id";
    params.client_id = client_id;
  }

  query += " ORDER BY name ASC";

  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({ ...r, price_history: [] })); // optimización: no cargar historial para la lista
}

export async function searchProductsAction(q, client_id) {
  let query = "SELECT * FROM products WHERE (name LIKE :q OR category LIKE :q)";
  const params = { q: `%${q}%` };

  if (client_id) {
    query += " AND (client_id IS NULL OR client_id = :client_id)";
    params.client_id = client_id;
  }

  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({ ...r, price_history: [] }));
}
