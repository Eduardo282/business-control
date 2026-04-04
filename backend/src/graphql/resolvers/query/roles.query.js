import { listRolesAction } from "../../actions/roles_actions/listRoles.action.js";

// Query pública para permitir el formulario de registro
export const roles = async () => {
  return listRolesAction();
};
