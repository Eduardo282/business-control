import { pool } from "../../../config/db.js";

export const listPortalQuotesAction = async (client_id) => {
  const [rows] = await pool.query(
    `SELECT * FROM quotes 
     WHERE client_id = ? 
     AND is_sent_to_client_portal = 1 
     AND is_deleted_admin = 0
     ORDER BY created_at DESC`,
    [client_id],
  );
  return rows;
};
