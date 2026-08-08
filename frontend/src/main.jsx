import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { initializeTheme } from "./context/theme.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, //5 minutes
    },
  },
});

// Apply the validated route-specific preference before React mounts to avoid
// a light/dark first-paint flash.
initializeTheme();
 
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
import { NotificationProvider } from "./context/NotificationContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
