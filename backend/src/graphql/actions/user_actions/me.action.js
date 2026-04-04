import { pool } from "../../../config/db.js";

export async function meAction(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.telefono, r.id AS role_id, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = :userId AND u.is_active = 1
     LIMIT 1`,
    { userId },
  );

  const u = rows?.[0];
  if (!u) return null;

  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    telefono: u.telefono,
    role: { id: u.role_id, name: u.role_name },
  };
}
