import { pool } from "../../../config/db.js";

export const getQuoteAction = async (id) => {
  const [rows] = await pool.query("SELECT * FROM quotes WHERE id = ?", [id]);
  return rows[0];
};
