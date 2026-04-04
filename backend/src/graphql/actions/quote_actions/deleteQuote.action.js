import { pool } from "../../../config/db.js";

export async function deleteQuoteAction(id) {
  const result = await pool.query("DELETE FROM quotes WHERE id = :id", { id });
  return result[0].affectedRows > 0;
}
