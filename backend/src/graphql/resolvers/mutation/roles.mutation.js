import { createRoleAction } from "../../actions/roles_actions/createRole.action.js";
import { deleteRoleAction } from "../../actions/roles_actions/deleteRole.action.js";

export const createRole = (_, { name }) => createRoleAction({ name });
export const deleteRole = (_, { id }) => deleteRoleAction({ id });
