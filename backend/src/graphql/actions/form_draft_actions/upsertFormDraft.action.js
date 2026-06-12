import { upsertFormDraft } from "../../../repositories/formDraft.repository.js";

export async function upsertFormDraftAction({ userId, input }) {
  return upsertFormDraft({
    userId,
    formKey: input.form_key,
    scopeKey: input.scope_key,
    dataJson: input.data_json,
  });
}
