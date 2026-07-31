import { listRolesAction } from "../../../modules/users/userActions.js";

// Query pública para permitir el formulario de registro
export const roles = async () => {
  return listRolesAction();
};
