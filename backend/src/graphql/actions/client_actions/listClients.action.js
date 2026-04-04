import { pool } from "../../../config/db.js";

export async function listClientsAction() {
  const [rows] = await pool.query(
    `SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad
     FROM clients
     ORDER BY business_name ASC`,
  );

  return rows;
}
