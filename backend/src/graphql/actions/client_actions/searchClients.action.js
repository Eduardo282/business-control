import { pool } from "../../../config/db.js";

export async function searchClientsAction(q) {
  const term = `%${q.trim()}%`;
  const [rows] = await pool.query(
    `SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad
     FROM clients
     WHERE business_name LIKE :term OR rfc LIKE :term OR email1 LIKE :term
     ORDER BY business_name ASC`,
    { term },
  );

  return rows;
}
