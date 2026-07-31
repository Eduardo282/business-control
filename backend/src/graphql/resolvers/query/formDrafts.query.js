import { requireRoles } from "../../../middlewares/role.middleware.js";
import { getFormDraftAction } from "../../../modules/drafts/draftActions.js";

export const formDraft = async (_parent, { form_key, scope_key }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return getFormDraftAction({
    userId: ctx.user.userId,
    formKey: form_key,
    scopeKey: scope_key,
  });
};
