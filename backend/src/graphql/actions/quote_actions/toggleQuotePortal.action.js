import { pool } from "../../../config/db.js";

export const toggleQuotePortalAction = async (id, access, contact_id) => {
  const [result] = await pool.query(
    "UPDATE quotes SET is_sent_to_client_portal = ?, contact_id = ? WHERE id = ?",
    [access ? 1 : 0, contact_id || null, id],
  );
  return result.affectedRows > 0;
};
