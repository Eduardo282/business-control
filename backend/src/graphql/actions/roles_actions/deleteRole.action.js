import { pool } from "../../../config/db.js";

export async function deleteRoleAction({ id }) {
  // Check if role has users assigned
  const [users] = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE role_id = :id`,
    { id },
  );

  if (users[0].count > 0) {
    throw new Error("No se puede eliminar un rol que tiene usuarios asignados");
  }

  const [result] = await pool.query(`DELETE FROM roles WHERE id = :id`, { id });

  return result.affectedRows > 0;
}
