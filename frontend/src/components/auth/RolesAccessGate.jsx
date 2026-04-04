import { useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";

export default function RolesAccessGate({ children }) {
  const location = useLocation();
  const stateKey = location.state?.roles_access_key;
  const sessionKey = sessionStorage.getItem("roles_access_key");

  useEffect(() => {
    // Consumir el token asegurando que es un acceso único válido
    if (stateKey && sessionKey && stateKey === sessionKey) {
      sessionStorage.removeItem("roles_access_key");
    }
  }, [stateKey, sessionKey]);

  // Si no existe la llave o no coinciden, es acceso no autorizado (ej. directo por URL)
  if (!stateKey || !sessionKey || stateKey !== sessionKey) {
    return <Navigate to="/register" replace />;
  }

  return children;
}
