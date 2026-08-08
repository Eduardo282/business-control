import { useEffect, useState, useRef } from "react";
import { Link, useLocation, matchPath, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../context/NotificationContext.jsx";
import { logger } from "../../services/logger";
import ThemeToggle from "./ThemeToggle";
import { Bell, Check, XCircle, ChevronLeft, ChevronRight, X } from "@icons";
import {
  getUnreadQuoteRequestsApi,
  markQuoteNotificationReadApi,
  rejectQuoteApi,
  dismissQuoteNotificationApi,
  dismissAllQuoteNotificationsApi,
} from "../../actionsAPI/quotes.api";

function getSectionLabel(pathname = "") {
  if (pathname === "/") return null;
  if (pathname.startsWith("/clientes")) return "CONTACTOS";
  if (pathname.startsWith("/registrar-productos")) return "REGISTRAR PRODUCTOS";
  if (pathname.startsWith("/productos")) return "PRODUCTOS";
  if (pathname.startsWith("/polizas")) return "COTIZACIONES";
  if (pathname.startsWith("/ventas")) return "VENTAS";
  if (pathname.startsWith("/cotizaciones/historial")) {
    return "HISTORIAL DE COTIZACIONES";
  }
  if (pathname.startsWith("/cotizaciones/nueva")) return "GENERAR COTIZACION";
  if (pathname.startsWith("/cotizaciones/")) return "COTIZACIONES";
  if (pathname.startsWith("/soporte")) return "SOPORTE";
  return "PANEL DE CONTROL";
}

function isUnreadQuoteNotification(notif) {
  return ["SOLICITADA", "ACEPTADA", "RECHAZADA"].includes(notif.status) && !notif.notification_read;
}

function getQuoteNotificationMessage(notif) {
  if (notif.status === "ACEPTADA") return "aceptó la cotización.";
  if (notif.status === "RECHAZADA") return "rechazó la cotización.";
  return "requiere cotización.";
}

const getReloadId = () => Date.now();

export default function Topbar() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const sectionLabel = getSectionLabel(location.pathname);

  // States for Notifications
  const { notifications, setNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const notificationsRef = useRef(null);

  // Polling is now handled by NotificationContext

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
    if (e) e.stopPropagation();
    try {
      await markQuoteNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) =>
          String(n.id) === String(id) ? { ...n, notification_read: 1 } : n
        )
      );
    } catch (e) {
      logger.error("Error dismissing notification", e);
    }
  };

  const handleRemoveNotification = async (notif, e) => {
    if (e) e.stopPropagation();

    if (notif.status === "SOLICITADA") {
      setShowNotifications(false);
      const result = await Swal.fire({
        title: "¡Solicitud Pendiente!",
        text: "No puedes eliminar esta notificación sin atender la solicitud primero. ¿Qué deseas hacer?",
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: "#10b981",
        denyButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Aceptar",
        denyButtonText: "Rechazar",
        cancelButtonText: "Cancelar",
        reverseButtons: true
      });

      if (result.isConfirmed) {
        handleAcceptRequest(notif);
      } else if (result.isDenied) {
        handleRejectRequest(notif.id);
      }
      return;
    }

    try {
      await dismissQuoteNotificationApi(notif.id);
      setNotifications((prev) => prev.filter((n) => String(n.id) !== String(notif.id)));
    } catch (err) {
      logger.error("Error removing notification", err);
    }
  };

  const handleRemoveAllNotifications = async (e) => {
    if (e) e.stopPropagation();
    try {
      await dismissAllQuoteNotificationsApi();
      setNotifications([]);
    } catch (e) {
      logger.error("Error removing all notifications", e);
    }
  };

  const handleRejectRequest = async (id, e) => {
    if (e) e.stopPropagation();
    const result = await Swal.fire({
      title: "¿Rechazar solicitud?",
      text: "La solicitud se marcará como rechazada.",
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
          String(n.id) === String(id)
            ? { ...n, notification_read: 1, status: "RECHAZADA" }
            : n
        )
      );
      Swal.fire({
        title: "Rechazada",
        text: "La solicitud quedó rechazada.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (e) {
      logger.error("Error rejecting quote request", e);
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo rechazar la solicitud",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  const markAsReadIfUnread = async (notif) => {
    if (isUnreadQuoteNotification(notif)) {
      try {
        await markQuoteNotificationReadApi(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            String(n.id) === String(notif.id)
              ? { ...n, notification_read: 1 }
              : n
          )
        );
      } catch (e) {
        logger.error("Error marking notification read", e);
      }
    }
  };

  const handleAcceptRequest = async (notif) => {
    setShowNotifications(false);
    await markAsReadIfUnread(notif);
    const requestReload = getReloadId();
    navigate(
      `/cotizaciones/nueva?request_id=${notif.id}&source=notification&auto_resolve=1&request_reload=${requestReload}`
    );
  };

  const handleNavigate = async (notif) => {
    if (notif.status === "SOLICITADA") {
      setShowNotifications(false);
      Swal.fire({
        title: "¿Atender solicitud?",
        text: "Selecciona si deseas aceptar o rechazar esta solicitud de cotización.",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: "#10b981",
        denyButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Aceptar",
        denyButtonText: "Rechazar",
        cancelButtonText: "Más tarde",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          handleAcceptRequest(notif);
        } else if (result.isDenied) {
          handleRejectRequest(notif.id);
        }
      });
      return;
    }

    setShowNotifications(false);
    await markAsReadIfUnread(notif);
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

  const notifPageSize = 5;
  const notifTotalPages = Math.ceil(notifications.length / notifPageSize) || 1;
  const safeNotifPage = Math.min(notifPage, notifTotalPages);
  const paginatedNotifications = notifications.slice((safeNotifPage - 1) * notifPageSize, safeNotifPage * notifPageSize);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-300/70 bg-white/85 px-8 py-4 shadow-md backdrop-blur-sm transition-all duration-150 dark:border-white/10 dark:bg-dark-800/90 dark:shadow-black/30 motion-reduce:transition-none">
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
            className="ml-12 hidden animate-fade-in-up items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-900 shadow-sm transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 dark:border-white/20 dark:bg-white/10 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-white/15 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-800 md:flex motion-reduce:animate-none motion-reduce:transition-none">
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
              className="relative rounded-xl border border-zinc-300 bg-white p-2 text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-white/15 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-800"
              aria-label="Abrir notificaciones de cotización"
              aria-haspopup="dialog"
              aria-expanded={showNotifications}
            >
              {(() => {
                const unreadCount = notifications.filter(isUnreadQuoteNotification).length;
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
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-dark-700 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-dark-800">
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    Notificaciones
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#2277B4] dark:text-blue-400 px-2 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                      {notifications.filter(isUnreadQuoteNotification).length} Nuevas
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleRemoveAllNotifications}
                        className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-900/50 px-2 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                        title="Eliminar todas las notificaciones"
                      >
                        <X size={12} /> Eliminar todas
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                      <div className="size-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <Bell size={24} />
                      </div>
                      <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        No hay notificaciones
                      </span>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-white/5">
                      {paginatedNotifications.map((notif) => {
                        const isRejected = notif.status === "RECHAZADA";
                        const isAccepted = notif.status === "ACEPTADA";
                        const isUnread = isUnreadQuoteNotification(notif);
                        const isRead = !!notif.notification_read;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNavigate(notif)}
                            className={`p-4 transition-all flex flex-col gap-2.5 border-l-4 ${
                              isRejected
                                ? "bg-red-50/30 dark:bg-red-950/10 border-red-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5"
                                : isAccepted
                                  ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5"
                                : isUnread
                                  ? "bg-blue-50/40 dark:bg-blue-950/10 border-[#2277B4] cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5"
                                  : "bg-white dark:bg-dark-900 border-transparent cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5"
                            }`}
                          >
                            {/* Contenido Superior */}
                            <div className={`flex items-start gap-3 w-full ${isRead && notif.status === 'SOLICITADA' ? "opacity-45" : ""}`}>
                              <div className={`${isRejected ? "bg-red-100 dark:bg-red-500/20" : isAccepted ? "bg-emerald-100 dark:bg-emerald-500/20" : isUnread ? "bg-blue-100 dark:bg-blue-500/20" : "bg-zinc-100 dark:bg-dark-700"} p-2 rounded-lg shrink-0 transition-colors`}>
                                {isRejected ? (
                                  <XCircle size={16} className="text-red-500 dark:text-red-400" />
                                ) : isAccepted ? (
                                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Bell size={16} className={isUnread ? "text-[#2277B4] dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug transition-colors ${isUnread ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-500 dark:text-zinc-400"}`}>
                                  <span className={`font-semibold ${isUnread ? "text-zinc-950 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>{notif.contact?.full_name || "Desconocido"}</span>{" "}
                                  {getQuoteNotificationMessage(notif)}
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
                                  {isAccepted && (
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                      ACEPTADA
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Fila de Acciones Inferior */}
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5 w-full">
                              {notif.status === "SOLICITADA" ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcceptRequest(notif);
                                    }}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm transition-all duration-150 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 dark:focus-visible:ring-emerald-400"
                                    title="Aceptar y generar cotización"
                                  >
                                    <Check size={12} /> Aceptar
                                  </button>
                                  <button
                                    onClick={(e) => handleRejectRequest(notif.id, e)}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 shadow-sm transition-all duration-150 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 dark:focus-visible:ring-red-400"
                                    title="Rechazar solicitud de cotización"
                                  >
                                    <XCircle size={12} /> Rechazar
                                  </button>
                                </>
                              ) : null}
                              {(isAccepted || isRejected) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(notif);
                                  }}
                                  className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 ${
                                    isAccepted
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 dark:focus-visible:ring-emerald-400"
                                      : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-600 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 dark:focus-visible:ring-red-400"
                                  }`}
                                  title={isAccepted ? "Ver cotización aceptada" : "Ver cotización rechazada"}
                                >
                                  {isAccepted ? <Check size={12} /> : <XCircle size={12} />} Ver
                                </button>
                              )}
                              {isUnread && (
                                <button
                                  onClick={(e) => handleDismiss(notif.id, e)}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 shadow-sm transition-all duration-150 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:focus-visible:ring-blue-400"
                                  title="Marcar notificación como leída"
                                >
                                  <Check size={12} /> Leída
                                </button>
                              )}
                              <button
                                onClick={(e) => handleRemoveNotification(notif, e)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-600 shadow-sm transition-all duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-white/20 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:focus-visible:ring-white/30"
                                title="Eliminar notificación"
                              >
                                <X size={12} /> Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {notifTotalPages > 1 && (
                  <div className="px-4 py-2 border-t border-zinc-200 dark:border-dark-700 flex items-center justify-between bg-zinc-50 dark:bg-dark-800">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Pág. {safeNotifPage} de {notifTotalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setNotifPage(Math.max(1, safeNotifPage - 1)); }}
                        disabled={safeNotifPage === 1}
                        className="rounded border border-zinc-300 bg-white p-1 text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-dark-700 dark:text-zinc-200 dark:hover:bg-white/10 dark:focus-visible:ring-blue-400"
                        aria-label="Página anterior de notificaciones"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setNotifPage(Math.min(notifTotalPages, safeNotifPage + 1)); }}
                        disabled={safeNotifPage === notifTotalPages}
                        className="rounded border border-zinc-300 bg-white p-1 text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-dark-700 dark:text-zinc-200 dark:hover:bg-white/10 dark:focus-visible:ring-blue-400"
                        aria-label="Página siguiente de notificaciones"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
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
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 dark:border-white/20 dark:bg-white/10 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-white/15 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-800">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
