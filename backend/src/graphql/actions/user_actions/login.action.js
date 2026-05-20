import { findActiveUserByEmail } from "../../../repositories/user.repository.js";
import { signToken } from "../../../utils/jwt.js";
import { comparePassword } from "../../../utils/password.js";

export async function loginAction({ email, password }) {
  const user = await findActiveUserByEmail(email);
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

