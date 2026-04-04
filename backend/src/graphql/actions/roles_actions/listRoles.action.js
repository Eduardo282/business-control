import { pool } from '../../../config/db.js';

export async function listRolesAction() {
  const [rows] = await pool.query(`SELECT id, name FROM roles ORDER BY id ASC`);
  return rows;
}
