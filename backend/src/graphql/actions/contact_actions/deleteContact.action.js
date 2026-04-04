import { pool } from "../../../config/db.js";

export async function deleteContactAction(id) {
  const [res] = await pool.query(
    "UPDATE client_contacts SET is_active = 0, has_portal_access = 0 WHERE id = :id",
    { id },
  );
  return res.affectedRows > 0;
}
