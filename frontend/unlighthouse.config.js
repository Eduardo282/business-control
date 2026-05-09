// frontend/unlighthouse.config.js
export default {
  site: "http://localhost:5173",
  cache: false,
  defaultQueryParams: {
    lh_token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NjI4NTc5OSwiZXhwIjoxNzc2ODkwNTk5fQ.dB7udp5a4tIyqtDSXUGfyQM6hAssvoFBOwMM4YWo25E",
  },
  lighthouseOptions: {
    disableStorageReset: true,
  },
  scanner: {
    dynamicSampling: false,
    crawler: false,
    skipJavascript: false,
    exclude: ["/register", "/roles", "/login", "/portal/login"],
  },
  // Inyeccion nativa de sesion para rutas protegidas (sin hooks personalizados).
  localStorage: {
    bc_token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NjI4NTc5OSwiZXhwIjoxNzc2ODkwNTk5fQ.dB7udp5a4tIyqtDSXUGfyQM6hAssvoFBOwMM4YWo25E",
  },
  urls: [
    "/",
    "/clientes",
    "/productos",
    "/polizas",
    "/cotizaciones/historial",
    "/cotizaciones/nueva",
    "/registrar-productos",
  ],
};
