import { deleteRole } from "../../../repositories/role.repository.js";
import { findUserByRoleId } from "../../../repositories/user.repository.js";

export async function deleteRoleAction({ id }) {
  // Check if role has users assigned
  const hasUser = await findUserByRoleId(id);

  if (hasUser) {
    throw new Error("No se puede eliminar un rol que tiene usuarios asignados");
  }

  await deleteRole(id);

  return true;
}
