import { requireRoles } from "../../../middlewares/role.middleware.js";
import { listAllPoliciesAction } from "../../actions/policy_actions/listAllPolicies.action.js";

export const policies = async (_parent, _args, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return listAllPoliciesAction();
};
