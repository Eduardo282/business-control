import { listRolesOrderedById } from "../../../repositories/role.repository.js";

export async function listRolesAction() {
  return await listRolesOrderedById();
}
