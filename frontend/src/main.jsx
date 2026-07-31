import React from "react";
import ReactDOM from "react-dom/client";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { initializeTheme } from "./context/theme.js";

// Apply the validated route-specific preference before React mounts to avoid
// a light/dark first-paint flash.
initializeTheme();

registerLocale("es", es);
setDefaultLocale("es");

// Permite que herramientas de auditoria en desarrollo inyecten sesion
// sin tocar rutas de login ni modales protegidos.
if (import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search);
  const auditToken = params.get("lh_token");

  if (auditToken) {
    localStorage.setItem("bc_token", auditToken);
  }
}

import { HelmetProvider } from "react-helmet-async";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
