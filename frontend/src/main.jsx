import React from "react";
import ReactDOM from "react-dom/client";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import App from "./App.jsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

registerLocale("es", es);
setDefaultLocale("es");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
