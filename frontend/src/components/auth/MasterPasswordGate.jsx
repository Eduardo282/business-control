import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyMasterPasswordApi } from "../../actionsAPI/auth.api";
import { notificationService } from "../../services/notificationService";

const Login = lazy(() => import("../../pages/auth/Login"));
const PortalLogin = lazy(() => import("../../pages/portal/PortalLogin"));

// ── Variable en memoria del módulo ────────────────────────────────────────
// A diferencia de sessionStorage, esta variable se resetea en cualquier
// recarga de página (incluida la navegación por barra de URL), pero persiste
// durante la navegación SPA normal dentro de la misma carga de página.
let _masterGranted = false;

// Sanitizar la ruta local para prevenir vulnerabilidades de Open Redirect
function safelyGetLastRoute() {
  const route = sessionStorage.getItem("last_route");
  if (typeof route !== "string") return "/login";
  // Evitar rutas absolutas o protocol-relative (//malicious.com) que causan Open Redirect
  if (!route.startsWith("/") || route.startsWith("//") || route.startsWith("/\\")) {
    return "/login";
  }
  return route;
}

// Devuelve el componente de fondo según la última ruta que visitó el usuario
function BackgroundPage() {
  const lastRoute = safelyGetLastRoute();
  const BackgroundComponent =
    lastRoute === "/portal/login" ? PortalLogin : Login;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#eef2f7]" />}>
      <BackgroundComponent />
    </Suspense>
  );
}

export function resetMasterGranted() {
  _masterGranted = false;
}

export default function MasterPasswordGate({ children }) {
  const [granted, setGranted] = useState(() => _masterGranted);
  const navigate = useNavigate();

  // ── Pedir contraseña si no se ha concedido acceso ─────────────────────
  useEffect(() => {
    if (granted) return;

    // isMounted evita efectos secundarios del doble-montaje de React.StrictMode
    let isMounted = true;

    const askPassword = async () => {
      const result = await notificationService.passwordPrompt({
        title:
          '<span style="color:#162A42;font-size:1.25rem;font-weight:700">🔒 Acceso Restringido</span>',
        html: `
          <p style="color:#6b7280;font-size:0.9rem;margin-bottom:2px;">
            Sección exclusiva para el administrador del sistema.
          </p>
          <p style="color:#6b7280;font-size:0.9rem;">
            Ingresar contraseña para continuar.
          </p>
        `,
        input: "password",
        inputPlaceholder: "Escribe tu contraseña...",
        inputAttributes: {
          autocomplete: "current-password",
          style: "font-size:1rem;letter-spacing:0.05em;",
        },
        confirmButtonText: "Ingresar",
        cancelButtonText: "Cancelar",
        showCancelButton: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor: "#162A42",
        cancelButtonColor: "#9ca3af",
        background: "#ffffff",
        customClass: {
          popup: "swal-register-popup",
          input: "swal-register-input",
        },
        inputValidator: (val) => {
          if (!val) return "Por favor ingresa la contraseña maestra.";
        },
      });

      // Si el componente ya se desmontó (p.ej. StrictMode cleanup), ignorar
      if (!isMounted) return;

      const { value, isDismissed } = result;

      if (isDismissed) {
        const back = safelyGetLastRoute();
        navigate(back, { replace: true });
        return;
      }

      try {
        const isCorrect = await verifyMasterPasswordApi(value);
        if (isCorrect) {
          _masterGranted = true;
          setGranted(true);
          await notificationService.success(
            "Access granted",
            "Welcome, Tecno360.",
          );
          notificationService.close();
        } else {
          await notificationService.error(
            "Incorrect password",
            "You do not have permission to access this section.",
          );
          if (isMounted) {
            const back = safelyGetLastRoute();
            navigate(back, { replace: true });
          }
        }
      } catch (error) {
        await notificationService.error(
          "Connection error",
          error.message || "The password could not be verified.",
        );
        if (isMounted) {
          const back = safelyGetLastRoute();
          navigate(back, { replace: true });
        }
      }
    };

    askPassword();

    return () => {
      isMounted = false;
      notificationService.close();
    };
  }, [navigate, granted]);

  if (!granted) return <BackgroundPage />;

  return children;
}
