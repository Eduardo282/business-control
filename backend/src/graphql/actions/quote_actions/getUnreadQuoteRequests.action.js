import { pool } from "../../../config/db.js";

export const getUnreadQuoteRequestsAction = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM quotes WHERE status = 'REQUESTED' AND (notification_read IS NULL OR notification_read = 0) ORDER BY created_at DESC",
  );
  return rows;
};
