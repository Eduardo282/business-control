import {
  deleteRole,
  findRoleByName,
  insertRole,
  listRoles,
} from "../../repositories/role.repository.js";
import {
  findActiveUserByEmail,
  findActiveUserWithRoleById,
  findUserByRoleId,
  insertUser,
  updateUserCredentials,
} from "../../repositories/user.repository.js";
import { signToken } from "../../utils/jwt.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import {
  isStrongPassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "../../../../shared/validation.js";

/**
 * Authenticates a backoffice user.
 */
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

/**
 * Retrieves authenticated user data.
 */
export async function meAction(userId) {
  return await findActiveUserWithRoleById(userId);
}

/**
 * Registers a new backoffice user with role verification.
 */
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

/**
 * Lists all backoffice roles.
 */
export async function listRolesAction() {
  return listRoles();
}

/**
 * Creates a backoffice role.
 */
export async function createRoleAction({ name }) {
  const roleName = name?.trim().toUpperCase();
  if (!roleName) throw new Error("Nombre de rol requerido");

  try {
    const insertId = await insertRole(roleName);

    return {
      id: insertId,
      name: roleName,
    };
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY") throw new Error("El rol ya existe");
    throw e;
  }
}

/**
 * Deletes a backoffice role.
 */
export async function deleteRoleAction({ id }) {
  return deleteRole(id);
}
