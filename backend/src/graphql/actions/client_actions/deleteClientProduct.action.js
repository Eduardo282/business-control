import { pool } from "../../../config/db.js";

export async function deleteClientProductAction(id) {
  await pool.query("DELETE FROM client_products WHERE id = :id", { id });
  return true;
}
