import { createRoleAction } from "../../../modules/users/userActions.js";
import { deleteRoleAction } from "../../../modules/users/userActions.js";
import { requireRoles } from "../../../middlewares/role.middleware.js";

export const createRole = (_, { name }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return createRoleAction({ name });
};

export const deleteRole = (_, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return deleteRoleAction({ id });
};
