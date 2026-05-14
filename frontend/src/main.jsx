import React from "react";
import ReactDOM from "react-dom/client";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

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
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
