import { pool } from "../../../config/db.js";

export const listQuotesAction = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM quotes WHERE status != 'REQUESTED' ORDER BY created_at DESC",
  );
  return rows;
};

export const listQuotesByClientAction = async (client_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM quotes WHERE client_id = ? AND status != 'REQUESTED' ORDER BY created_at DESC",
    [client_id],
  );
  return rows;
};

export const listQuotesByUserAction = async (user_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM quotes WHERE user_id = ? AND status != 'REQUESTED' ORDER BY created_at DESC",
    [user_id],
  );
  return rows;
};
