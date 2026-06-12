import { findFormDraft } from "../../../repositories/formDraft.repository.js";

export async function getFormDraftAction({ userId, formKey, scopeKey }) {
  return findFormDraft({ userId, formKey, scopeKey });
}
