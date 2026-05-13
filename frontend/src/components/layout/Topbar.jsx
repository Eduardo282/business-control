import { useContext, useEffect, useState, useRef } from "react";
import { Link, useLocation, matchPath, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { Bell, X } from "@icons";
import {
  getUnreadQuoteRequestsApi,
  markQuoteNotificationReadApi,
} from "../../actionsAPI/quotes.api";

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
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const sectionLabel = getSectionLabel(location.pathname);

  // States for Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    if (user?.role?.name === "ADMIN" || user?.role?.name === "VENTAS") {
      const fetchNotifs = async () => {
        try {
          const res = await getUnreadQuoteRequestsApi();
          setNotifications(res || []);
        } catch (e) {
          console.error("Error fetching notifications", e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      await markQuoteNotificationReadApi(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (id) => {
    setShowNotifications(false);
    navigate(`/cotizaciones/nueva?request_id=${id}`);
  };

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
    <div className="flex items-center justify-between px-8 py-4 bg-white/70 dark:bg-dark-800/80 backdrop-blur-md border-light-border/50 dark:border-white/10 sticky top-0 z-50 shadow-md dark:shadow-black/30 transition-all duration-300">
      <div className="text-zinc-800 dark:text-zinc-100 tracking-tight flex items-center gap-4">
        <div>
          <div className="font-semibold text-lg">Panel de Control</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
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
            className="ml-12 hidden md:flex items-center gap-2 px-4 py-2 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-white/10 rounded-xl border border-[#CBD5E1] dark:border-white/15 hover:bg-[#F8FAFC] dark:hover:bg-white/15 hover:border-[#B8C6D8] shadow-sm transition-colors duration-150 font-semibold animate-fade-in-up">
            <span>Generar Cotización</span>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        {(user?.role?.name === "ADMIN" || user?.role?.name === "VENTAS") && (
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-white dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300"
            >
              <Bell size={20} className={notifications.length > 0 ? "animate-pulse text-indigo-500" : ""} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-dark-800">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-900 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-zinc-100 dark:border-white/10 overflow-hidden z-50 animate-fade-in-down">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-dark-800">
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Notificaciones</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-1 rounded-full font-medium">
                    {notifications.length} Nuevas
                  </span>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                      No tienes notificaciones nuevas
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-50 dark:divide-white/5">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNavigate(notif.id)}
                          className="p-4 hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex items-start gap-3"
                        >
                          <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg shrink-0">
                            <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 dark:text-zinc-200">
                              <span className="font-semibold">{notif.contact?.full_name || "Desconocido"}</span> requiere cotización.
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                              Cotización #{notif.id} • {notif.client?.business_name}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDismiss(notif.id, e)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title="Marcar como leída"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User info */}
        <div className="px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center gap-3 backdrop-blur-sm shadow-sm">
          <div className="size-2 rounded-full bg-[#2277B4] animate-pulse"></div>
          <div className="text-sm">
            {isHome ?
              <>
                <span className="text-zinc-500 dark:text-zinc-400 mr-2">HOLA,</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {user?.full_name?.split(" ")[0]?.toUpperCase()}
                </span>
              </>
            : <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {sectionLabel}
              </span>
            }
          </div>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout button */}
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 rounded-xl bg-white dark:bg-white/10 border border-[#CBD5E1] dark:border-white/15 hover:bg-[#F8FAFC] dark:hover:bg-white/15 hover:border-[#B8C6D8] shadow-sm transition-colors duration-150">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
