import { gql } from "../utils/graphqlClient";

export async function getFormDraftApi(form_key, scope_key = "global") {
  const query = `
    query GetFormDraft($form_key: String!, $scope_key: String) {
      formDraft(form_key: $form_key, scope_key: $scope_key) {
        id
        form_key
        scope_key
        data_json
        updated_at
      }
    }
  `;
  const data = await gql(query, { form_key, scope_key });
  return data.formDraft;
}

export async function upsertFormDraftApi({
  form_key,
  scope_key = "global",
  data: draftData,
}) {
  const query = `
    mutation UpsertFormDraft($input: UpsertFormDraftInput!) {
      upsertFormDraft(input: $input) {
        id
        form_key
        scope_key
        data_json
        updated_at
      }
    }
  `;
  const data = await gql(query, {
    input: {
      form_key,
      scope_key,
      data_json: JSON.stringify(draftData || {}),
    },
  });
  return data.upsertFormDraft;
}

export async function deleteFormDraftApi(form_key, scope_key = "global") {
  const query = `
    mutation DeleteFormDraft($form_key: String!, $scope_key: String) {
      deleteFormDraft(form_key: $form_key, scope_key: $scope_key)
    }
  `;
  const data = await gql(query, { form_key, scope_key });
  return data.deleteFormDraft;
}
