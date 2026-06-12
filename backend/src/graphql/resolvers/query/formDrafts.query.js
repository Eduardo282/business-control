import { requireRoles } from "../../../middlewares/role.middleware.js";
import { getFormDraftAction } from "../../actions/form_draft_actions/getFormDraft.action.js";

export const formDraft = async (_parent, { form_key, scope_key }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return getFormDraftAction({
    userId: ctx.user.userId,
    formKey: form_key,
    scopeKey: scope_key,
  });
};
