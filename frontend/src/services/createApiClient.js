import axios from "axios";

const graphqlBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

/**
 * Factory to create a configured Axios client for GraphQL.
 * Avoids duplicating HTTP client setup between backoffice and portal.
 *
 * @param {{ getToken: () => string | null }} options
 * @returns {import('axios').AxiosInstance}
 */
export function createApiClient({ getToken }) {
  const client = axios.create({
    baseURL: graphqlBaseUrl,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}
