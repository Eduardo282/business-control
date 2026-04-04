import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/graphql",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  let token = localStorage.getItem("bc_token");
  if (window.location.pathname.startsWith("/portal")) {
    token = sessionStorage.getItem("bc_portal_token");
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
