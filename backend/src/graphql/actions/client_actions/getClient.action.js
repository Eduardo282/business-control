import { pool } from "../../../config/db.js";

export async function getClientAction(id) {
  const [rows] = await pool.query(
    `SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad
     FROM clients
     WHERE id = :id
     LIMIT 1`,
    { id },
  );

  const c = rows?.[0];
  if (!c) return null;

  return c;
}
