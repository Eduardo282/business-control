import { requireRoles } from "../../../middlewares/role.middleware.js";
import { deleteFormDraftAction } from "../../actions/form_draft_actions/deleteFormDraft.action.js";
import { upsertFormDraftAction } from "../../actions/form_draft_actions/upsertFormDraft.action.js";

export const upsertFormDraft = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return upsertFormDraftAction({
    userId: ctx.user.userId,
    input,
  });
};

export const deleteFormDraft = async (_parent, { form_key, scope_key }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
  return deleteFormDraftAction({
    userId: ctx.user.userId,
    formKey: form_key,
    scopeKey: scope_key,
  });
};
