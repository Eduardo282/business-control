import { insertRole } from "../../../repositories/role.repository.js";

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
