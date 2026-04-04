import { pool } from "../../../config/db.js";

export async function getContactAction(id) {
  const [rows] = await pool.query(
    "SELECT * FROM client_contacts WHERE id = :id",
    { id }
  );
  return rows[0];
}
