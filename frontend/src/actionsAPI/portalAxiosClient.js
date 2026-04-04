import axios from "axios";

export const portalAxiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/graphql",
  headers: { "Content-Type": "application/json" },
});

portalAxiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("bc_portal_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
