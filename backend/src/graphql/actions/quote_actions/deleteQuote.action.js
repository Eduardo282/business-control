import { pool } from "../../../config/db.js";

export async function deleteQuoteAction(id) {
  const result = await pool.query("UPDATE quotes SET is_deleted_admin = 1 WHERE id = :id", { id });
  return result[0].affectedRows > 0;
}
