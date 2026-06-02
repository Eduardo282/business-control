import { createApiClient } from "../services/createApiClient";

/**
 * Default API client for backoffice.
 * Resolves token from localStorage (backoffice) or sessionStorage (portal)
 * depending on the current route path.
 */
export const axiosClient = createApiClient({
  getToken: () => {
    if (window.location.pathname.startsWith("/portal")) {
      return sessionStorage.getItem("bc_portal_token");
    }
    return localStorage.getItem("bc_token");
  },
});
