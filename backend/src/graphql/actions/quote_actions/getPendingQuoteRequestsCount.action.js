import { pool } from "../../../config/db.js";

export const getPendingQuoteRequestsCountAction = async () => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as count FROM quotes WHERE status = 'REQUESTED' AND is_deleted_admin = 0",
  );
  return rows[0].count;
};
