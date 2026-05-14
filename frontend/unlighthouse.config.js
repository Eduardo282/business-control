// frontend/unlighthouse.config.js
export default {
  site: "http://localhost:5173",
  cache: false,
  defaultQueryParams: {
    lh_token: process.env.UNLIGHTHOUSE_TOKEN || "",
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
    bc_token: process.env.UNLIGHTHOUSE_TOKEN || "",
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
