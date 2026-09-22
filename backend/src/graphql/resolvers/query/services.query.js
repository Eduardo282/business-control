import { requireRoles } from "../../../middlewares/role.middleware.js";
import { listAllServicesAction } from "../../../modules/services/serviceActions.js";

export const services = async (_parent, _args, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return listAllServicesAction();
};
