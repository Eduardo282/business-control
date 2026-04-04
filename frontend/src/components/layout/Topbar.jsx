import { useContext } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";

function getSectionLabel(pathname = "") {
  if (pathname === "/") return null;
  if (pathname.startsWith("/clientes")) return "CONTACTOS";
  if (pathname.startsWith("/registrar-productos")) return "REGISTRAR PRODUCTOS";
  if (pathname.startsWith("/productos")) return "PRODUCTOS";
  if (pathname.startsWith("/polizas")) return "SERVICIOS Y POLIZAS";
  if (pathname.startsWith("/cotizaciones/historial")) {
    return "HISTORIAL DE COTIZACIONES";
  }
  if (pathname.startsWith("/cotizaciones/nueva")) return "GENERAR COTIZACION";
  if (pathname.startsWith("/cotizaciones/")) return "COTIZACIONES";
  return "PANEL DE CONTROL";
}

export default function Topbar() {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const sectionLabel = getSectionLabel(location.pathname);

  // Verificar si estamos en detalle de cliente
  const clientMatch = matchPath("/clientes/:id", location.pathname);

  const logout = () => {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

    Toast.fire({
      icon: "success",
      title: "Sesión cerrada correctamente",
    });

    localStorage.removeItem("bc_token");
    setUser(null);
  };

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-md border-light-border/50 sticky top-0 z-50 shadow-md transition-all duration-300">
      <div className="text-gray-800 tracking-tight flex items-center gap-4">
        <div>
          <div className="font-semibold text-lg">Panel de Control</div>
          <div className="text-sm text-gray-500">
            Bienvenido {user?.full_name} • XXXX3 •{" "}
            {new Date().toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Botón dinámico Generar Cotización para Cliente */}
        {clientMatch && (
          <Link
            to={`/cotizaciones/nueva?client_id=${clientMatch.params.id}`}
            className="ml-12 hidden md:flex items-center gap-2 px-4 py-2 text-black transition-all font-semibold shadow-lg shadow-black/20 animate-fade-in-up">
            <span>Generar Cotización</span>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* User info */}
        <div className="px-4 py-2 rounded-xl bg-white/50 border border-white/60 flex items-center gap-3 backdrop-blur-sm shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#2277B4] animate-pulse"></div>
          <div className="text-sm">
            {isHome ?
              <>
                <span className="text-gray-500 mr-2">HOLA,</span>
                <span className="font-semibold text-gray-800">
                  {user?.full_name?.split(" ")[0]?.toUpperCase()}
                </span>
              </>
            : <span className="font-semibold text-gray-800">
                {sectionLabel}
              </span>
            }
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-black rounded-xl bg-white transition-all duration-150 backdrop-blur-sm active:scale-95 active:translate-y-px shadow-lg shadow-slate-400">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
