import { pool } from "../../../config/db.js";
import { signToken } from "../../../utils/jwt.js";
import { comparePassword } from "../../../utils/password.js";

export async function loginAction({ email, password }) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.telefono, r.id AS role_id, r.name AS role_name, u.password_hash
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = :email AND u.is_active = 1
     LIMIT 1`,
    { email },
  );

  const user = rows?.[0];
  if (!user) throw new Error("Credenciales inválidas");

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new Error("Credenciales inválidas");

  const token = signToken({ userId: user.id, role: user.role_name });

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      telefono: user.telefono,
      role: { id: user.role_id, name: user.role_name },
    },
  };
}
