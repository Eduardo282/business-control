import { pool } from "../../../config/db.js";

export async function deleteContactProductAction(id) {
  await pool.query("DELETE FROM contact_products WHERE id = :id", { id });
  return true;
}
