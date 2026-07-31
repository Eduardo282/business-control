import { axiosClient } from "../actionsAPI/axiosClient";

/**
 * Executes a GraphQL query or mutation using an Axios HTTP client instance.
 * Preserves error codes, extension details, and error lists so consumers
 * can distinguish between UNAUTHENTICATED, FORBIDDEN, BAD_USER_INPUT,
 * and generic network/server failures.
 *
 * @template T
 * @param {string} query - The GraphQL query or mutation definition string.
 * @param {Record<string, unknown>} [variables={}] - Operation variables dictionary.
 * @param {import('axios').AxiosInstance} [client=axiosClient] - Custom Axios client instance.
 * @returns {Promise<T>} The `data` payload returned by the GraphQL execution.
 * @throws {Error & { code?: string, details?: unknown, errors?: unknown[] }} Custom GraphQL or network error.
 */
export async function gql(query, variables = {}, client = axiosClient) {
  let response;
  try {
    response = await client.post("", { query, variables });
  } catch (axiosError) {
    const message =
      axiosError.response?.data?.errors?.[0]?.message ||
      axiosError.message ||
      "Error de conexión con el servidor.";
    const error = new Error(message);
    error.code =
      axiosError.response?.data?.errors?.[0]?.extensions?.code ||
      (axiosError.response?.status === 401 ? "UNAUTHENTICATED" : "NETWORK_ERROR");
    error.details = axiosError.response?.data?.errors?.[0]?.extensions?.details;
    error.errors = axiosError.response?.data?.errors || [];
    throw error;
  }

  const { data } = response;

  if (!data?.errors?.length) {
    return data?.data;
  }

  const [firstError] = data.errors;
  const error = new Error(firstError.message || "Error al procesar la solicitud GraphQL.");
  error.code = firstError.extensions?.code || "GRAPHQL_ERROR";
  error.details = firstError.extensions?.details;
  error.errors = data.errors;
  throw error;
}
