import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getSocket } from "../../utils/socketManager.js";
import { useNotifications } from "../../context/NotificationContext.jsx";
import logo from "../../assets/logo.png";
import {
  LayoutDashboard,
  BadgeDollarSign,
  Package,
  PackagePlus,
  History,
  FileText,
  Headphones,
} from "@icons";

const SUPPORT_ROLES = ["ADMIN", "VENTAS", "SOPORTE"];

function Item({
  to,
  children,
  icon: Icon,
  disableActiveWhen = [],
  badge,
  disableWhenQuery = [],
}) {
  const location = useLocation();
  const shouldDisableActive =
    disableActiveWhen.some((prefix) => location.pathname.startsWith(prefix)) ||
    disableWhenQuery.some((queryKey) =>
      new URLSearchParams(location.search).has(queryKey),
    );

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:focus-visible:ring-blue-400 motion-reduce:transition-none ${
          isActive && !shouldDisableActive ?
            "bg-white/70 dark:bg-white/15 text-[#1d4ed8] dark:text-blue-400 font-semibold shadow-glass-sm border border-white/90 dark:border-white/20 border-t-white dark:border-t-white/30 backdrop-blur-md"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`
      }>
      <Icon size={20} strokeWidth={1.5} />
      <span>{children}</span>
      {badge > 0 && (
        <span className="absolute right-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ role }) {
  const { notifications } = useNotifications();
  const pendingCount = notifications ? notifications.filter(n => n.status === "SOLICITADA" && !n.notification_read).length : 0;
  
  const [supportWaitingCount, setSupportWaitingCount] = useState(0);
  const roleLabel = role === "ADMIN" ? "Administrador" : role;

  useEffect(() => {
    if (!SUPPORT_ROLES.includes(role)) return;
    const token = localStorage.getItem("bc_token");
    if (!token) return;

    const socket = getSocket(token);
    if (!socket) return;

    const handleConnect = () => socket.emit("queue:list");
    const handleQueueUpdate = (queue) => setSupportWaitingCount(Array.isArray(queue) ? queue.length : 0);
    const handleDisconnect = () => setSupportWaitingCount(0);

    socket.on("connect", handleConnect);
    socket.on("queue:update", handleQueueUpdate);
    socket.on("disconnect", handleDisconnect);

    return () => {
      // No disconnect here as socket is shared
      socket.off("connect", handleConnect);
      socket.off("queue:update", handleQueueUpdate);
      socket.off("disconnect", handleDisconnect);
    };
  }, [role]);

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-64 flex-col border-r border-white/60 dark:border-white/10 bg-white/60 dark:bg-dark-900/60 px-4 pb-4 pt-5 text-zinc-800 shadow-glass-lg dark:shadow-[8px_0_32px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-150 dark:text-zinc-100 motion-reduce:transition-none">
      {/* Rol actual */}
      <div className="mb-5 px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-white/80 dark:border-white/10 shadow-glass-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase whitespace-nowrap">
            {roleLabel}
          </div>
          <div className="flex h-10 w-24 items-center justify-center overflow-hidden shrink-0">
            <img
              src={logo}
              alt="Business Control"
              className="h-9 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav aria-label="Navegación principal" className="flex-1 space-y-1">
        <Item to="/" icon={LayoutDashboard}>
          Inicio
        </Item>

        {(role === "ADMIN" || role === "VENTAS" || role === "SOPORTE") && (
          <>
            <Item to="/productos" icon={Package}>
              Productos
            </Item>
            <Item to="/registrar-productos" icon={PackagePlus}>
              Registrar productos
            </Item>
            <Item
              to="/cotizaciones/nueva"
              icon={FileText}
              disableWhenQuery={["client_id"]}>
              Generar Cotización
            </Item>
            <Item to="/cotizaciones/aceptadas" icon={BadgeDollarSign}>
              Cotizaciones
            </Item>
            <Item to="/ventas" icon={BadgeDollarSign}>
              Ventas
            </Item>
            <Item
              to="/cotizaciones/historial"
              icon={History}
              badge={pendingCount}>
              Historial de Cotizaciones
            </Item>
            <Item to="/soporte" icon={Headphones} badge={supportWaitingCount}>
              Soporte
            </Item>
          </>
        )}
      </nav>

      <div className="pt-4 text-center">
        <span className="text-xs font-bold text-[#1a2b4c] dark:text-zinc-400 whitespace-nowrap">
          Business Control
        </span>
      </div>
    </aside>
  );
}
