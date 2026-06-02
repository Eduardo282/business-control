import { createRoleAction } from "../../actions/roles_actions/createRole.action.js";
import { deleteRoleAction } from "../../actions/roles_actions/deleteRole.action.js";
import { requireRoles } from "../../../middlewares/role.middleware.js";

export const createRole = (_, { name }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return createRoleAction({ name });
};

export const deleteRole = (_, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN"]);
  return deleteRoleAction({ id });
};
