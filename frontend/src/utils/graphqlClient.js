import { axiosClient } from "../actionsAPI/axiosClient";

/**
 * Execute a GraphQL request and return the data payload.
 * Preserves error code, details, and all errors from the response
 * so consumers can distinguish between UNAUTHENTICATED, FORBIDDEN,
 * BAD_USER_INPUT, and generic failures.
 *
 * @param {string} query - GraphQL query or mutation string
 * @param {object} variables - Variables for the operation
 * @param {import('axios').AxiosInstance} client - Axios instance to use
 * @returns {Promise<object>} The `data` field from the GraphQL response
 */
export async function gql(query, variables = {}, client = axiosClient) {
  const { data } = await client.post("", { query, variables });

  if (!data.errors?.length) {
    return data.data;
  }

  const [firstError] = data.errors;
  const error = new Error(firstError.message || "GraphQL request failed");
  error.code = firstError.extensions?.code || "GRAPHQL_ERROR";
  error.details = firstError.extensions?.details;
  error.errors = data.errors;
  throw error;
}
