import { useEffect, useState, useRef } from "react";
import { Link, useLocation, matchPath, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import { logger } from "../../services/logger";
import ThemeToggle from "./ThemeToggle";
import { Bell, Trash2, Check, XCircle } from "@icons";
import {
  getUnreadQuoteRequestsApi,
  markQuoteNotificationReadApi,
  deleteQuoteApi,
  rejectQuoteApi,
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
  if (pathname.startsWith("/soporte")) return "SOPORTE";
  return "PANEL DE CONTROL";
}

export default function Topbar() {
  const { user, setUser } = useAuth();
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
          logger.error("Error fetching notifications", e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 2000);
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, notification_read: true } : n))
      );
    } catch (e) {
      logger.error("Error dismissing notification", e);
    }
  };

  const handleDeleteRequest = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "¿Eliminar solicitud?",
      text: "Esta acción quitará la solicitud de la cola de notificaciones.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteQuoteApi(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      Swal.fire({
        title: "Eliminada",
        text: "La solicitud se eliminó de la cola.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      logger.error("Error deleting quote request", e);
      Swal.fire("Error", e.message || "No se pudo eliminar la solicitud", "error");
    }
  };

  const handleRejectRequest = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "¿Rechazar solicitud?",
      text: "La solicitud se marcará como rechazada y después podrás eliminarla de la cola.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await rejectQuoteApi(id);
      await markQuoteNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: "REJECTED", notification_read: true } : n
        )
      );
      Swal.fire({
        title: "Rechazada",
        text: "La solicitud quedó rechazada. Ahora puedes eliminarla de la cola.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      logger.error("Error rejecting quote request", e);
      Swal.fire("Error", e.message || "No se pudo rechazar la solicitud", "error");
    }
  };

  const handleNavigate = async (notif) => {
    setShowNotifications(false);
    if (notif.status === "REQUESTED") {
      try {
        await markQuoteNotificationReadApi(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, notification_read: true } : n))
        );
      } catch (e) {
        logger.error("Error navigating to quote request", e);
      }
      navigate(`/cotizaciones/nueva?request_id=${notif.id}`);
      return;
    }
    navigate(`/cotizaciones/${notif.id}`);
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
              {(() => {
                const unreadCount = notifications.filter(
                  (n) => n.status === "REQUESTED" && !n.notification_read
                ).length;
                return (
                  <>
                    <Bell size={20} className={unreadCount > 0 ? "animate-pulse text-[#2277B4]" : ""} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-dark-800">
                        {unreadCount}
                      </span>
                    )}
                  </>
                );
              })()}
            </button>

            {/* Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-[#ffffff] dark:bg-dark-900 rounded-2xl shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] border border-zinc-200 dark:border-dark-700 overflow-hidden z-[100] animate-fade-in-down opacity-100">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-dark-700 flex items-center justify-between bg-zinc-50 dark:bg-dark-800">
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Solicitudes de cotización</h3>
                  <span className="text-xs text-[#2277B4] dark:text-blue-400 px-2.5 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/30">
                    {notifications.filter((n) => n.status === "REQUESTED" && !n.notification_read).length} Nuevas
                  </span>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                      <div className="size-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <Bell size={24} />
                      </div>
                      <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        No hay solicitudes en cola
                      </span>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-white/5">
                      {notifications.map((notif) => {
                        const isRejected = notif.status === "REJECTED";
                        const isUnread = notif.status === "REQUESTED" && !notif.notification_read;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNavigate(notif)}
                            className={`p-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer flex flex-col gap-2.5 border-l-4 ${
                              isRejected
                                ? "bg-red-50/30 dark:bg-red-950/10 border-red-400"
                                : isUnread
                                  ? "bg-blue-50/40 dark:bg-blue-950/10 border-[#2277B4]"
                                  : "bg-white dark:bg-dark-900 border-transparent"
                            }`}
                          >
                            {/* Contenido Superior */}
                            <div className="flex items-start gap-3 w-full">
                              <div className={`${isRejected ? "bg-red-100 dark:bg-red-500/20" : isUnread ? "bg-blue-100 dark:bg-blue-500/20" : "bg-zinc-100 dark:bg-dark-700"} p-2 rounded-lg shrink-0 transition-colors`}>
                                {isRejected ? (
                                  <XCircle size={16} className="text-red-500 dark:text-red-400" />
                                ) : (
                                  <Bell size={16} className={isUnread ? "text-[#2277B4] dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug transition-colors ${isUnread ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-500 dark:text-zinc-400"}`}>
                                  <span className={`font-semibold ${isUnread ? "text-zinc-950 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>{notif.contact?.full_name || "Desconocido"}</span>{" "}
                                  {isRejected ? "tiene solicitud rechazada." : "requiere cotización."}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                    Cotización #{notif.id} • {notif.client?.business_name}
                                  </p>
                                  {isRejected && (
                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                                      RECHAZADA
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Fila de Acciones Inferior */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-white/5 w-full">
                              {isRejected ? (
                                <button
                                  onClick={(e) => handleDeleteRequest(notif.id, e)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 border border-red-200/50 dark:border-red-500/30 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                                  title="Eliminar solicitud rechazada de la cola"
                                >
                                  <Trash2 size={12} /> Eliminar
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => handleRejectRequest(notif.id, e)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 border border-red-200/50 dark:border-red-500/30 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                                  title="Rechazar solicitud de cotización"
                                >
                                  <XCircle size={12} /> Rechazar
                                </button>
                              )}
                              {isUnread && (
                                <button
                                  onClick={(e) => handleDismiss(notif.id, e)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#2277B4] dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-[#2277B4]/20 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                                  title="Marcar notificación como leída"
                                >
                                  <Check size={12} /> Marcar Leída
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
