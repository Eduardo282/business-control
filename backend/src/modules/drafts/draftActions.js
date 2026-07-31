import {
  deleteFormDraft,
  findFormDraft,
  upsertFormDraft,
} from "../../repositories/formDraft.repository.js";

/**
 * Retrieves a form draft for a user.
 */
export async function getFormDraftAction({ userId, formKey, scopeKey }) {
  return findFormDraft({ userId, formKey, scopeKey });
}

/**
 * Upserts a form draft for a user.
 */
export async function upsertFormDraftAction({ userId, input }) {
  return upsertFormDraft({
    userId,
    formKey: input.form_key,
    scopeKey: input.scope_key,
    dataJson: input.data_json,
  });
}

/**
 * Deletes a form draft for a user.
 */
export async function deleteFormDraftAction({ userId, formKey, scopeKey }) {
  return deleteFormDraft({ userId, formKey, scopeKey });
}
