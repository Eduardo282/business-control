import { hashPassword } from "../../../utils/password.js";
import { findRoleByName } from "../../../repositories/role.repository.js";
import {
  findUserByRoleId,
  insertUser,
  updateUserCredentials,
} from "../../../repositories/user.repository.js";
import {
  isStrongPassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../../../../../shared/validation.js";

export async function registerUserAction({
  full_name: fullName,
  email,
  telefono: phoneNumber,
  password,
  role_name: roleName,
}) {
  const role = roleName?.trim().toUpperCase();
  const phone = phoneNumber?.trim();

  if (!phone) {
    throw new Error("El teléfono es requerido");
  }

  if (!isStrongPassword(password)) {
    throw new Error(PASSWORD_REQUIREMENTS_MESSAGE);
  }

  const foundRole = await findRoleByName(role);
  if (!foundRole) {
    throw new Error("El rol seleccionado no existe");
  }

  const passwordHash = await hashPassword(password);
  const existingUser = await findUserByRoleId(foundRole.id);

  const userId = existingUser
    ? (await updateUserCredentials({
        user_id: existingUser.id,
        full_name: fullName,
        email,
        telefono: phone,
        password_hash: passwordHash,
      }), existingUser.id)
    : await insertUser({
        full_name: fullName,
        email,
        telefono: phone,
        password_hash: passwordHash,
        role_id: foundRole.id,
      });

  return {
    id: userId,
    full_name: fullName,
    email,
    telefono: phone,
    role: { id: foundRole.id, name: foundRole.name },
  };
}
