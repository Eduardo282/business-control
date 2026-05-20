import { findActiveUserWithRoleById } from "../../../repositories/user.repository.js";

export async function meAction(userId) {
  return await findActiveUserWithRoleById(userId);
}
