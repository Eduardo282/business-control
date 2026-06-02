import { createApiClient } from "../services/createApiClient";

/**
 * Dedicated API client for portal context.
 * Always reads token from sessionStorage.
 */
export const portalAxiosClient = createApiClient({
  getToken: () => sessionStorage.getItem("bc_portal_token"),
});
