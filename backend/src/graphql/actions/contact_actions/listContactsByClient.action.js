import { pool } from "../../../config/db.js";

export async function listContactsByClientAction(client_id) {
  const [rows] = await pool.query(
    `SELECT id, client_id, full_name, email, phone, position_title, has_portal_access, is_active
     FROM client_contacts
     WHERE client_id = :client_id
     ORDER BY is_active DESC, full_name ASC`,
    { client_id },
  );
  return rows.map((r) => ({
    ...r,
    has_portal_access: Boolean(r.has_portal_access),
    is_active: Boolean(r.is_active),
  }));
}
