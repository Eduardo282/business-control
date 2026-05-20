import { hashPassword } from "../../../utils/password.js";
import { findRoleByName } from "../../../repositories/role.repository.js";
import {
  findUserByRoleId,
  insertUser,
  updateUserCredentials,
} from "../../../repositories/user.repository.js";

export async function registerUserAction({
  full_name,
  email,
  telefono,
  password,
  role_name,
}) {
  const role = role_name?.trim().toUpperCase();
  const phone = telefono?.trim();

  if (!phone) {
    throw new Error("El teléfono es requerido");
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\+\-=\[\]{}|;:,.<>?/]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      "La contraseña debe tener mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos especiales.",
    );
  }

  // El rol debe existir en la tabla de roles
  const foundRole = await findRoleByName(role);

  if (!foundRole) {
    throw new Error("El rol seleccionado no existe");
  }

  const password_hash = await hashPassword(password);

  // Buscar usuario existente con ese rol
  const existingUser = await findUserByRoleId(foundRole.id);

  if (existingUser) {
    // Actualizar credenciales del usuario existente
    await updateUserCredentials({
      user_id: existingUser.id,
      full_name,
      email,
      telefono: phone,
      password_hash,
    });

    return {
      id: existingUser.id,
      full_name,
      email,
      telefono: phone,
      role: { id: foundRole.id, name: foundRole.name },
    };
  } else {
    // Crear nuevo usuario con el rol
    const userId = await insertUser({
      full_name,
      email,
      telefono: phone,
      password_hash,
      role_id: foundRole.id,
    });

    return {
      id: userId,
      full_name,
      email,
      telefono: phone,
      role: { id: foundRole.id, name: foundRole.name },
    };
  }
}
