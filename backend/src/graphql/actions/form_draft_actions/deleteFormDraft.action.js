import { deleteFormDraft } from "../../../repositories/formDraft.repository.js";

export async function deleteFormDraftAction({ userId, formKey, scopeKey }) {
  return deleteFormDraft({ userId, formKey, scopeKey });
}
