import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../../assets/logo.png";
import { getPendingQuoteRequestsCountApi } from "../../actionsAPI/quotes.api";
import { logger } from "../../services/logger";
import {
  LayoutDashboard,
  BadgeDollarSign,
  Package,
  PackagePlus,
  History,
  FileText,
  Headphones,
} from "@icons";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/graphql", "") ||
  "http://localhost:4000";
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
            "bg-white dark:bg-white/10 text-zinc-900 dark:text-zinc-100 shadow-[0_5px_5px_0px_#00000050] ring-1 ring-light-border/50 dark:ring-white/10"
          : "text-zinc-500 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100"
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
  const [pendingCount, setPendingCount] = useState(0);
  const [supportWaitingCount, setSupportWaitingCount] = useState(0);
  const roleLabel = role === "ADMIN" ? "Administrador" : role;

  useEffect(() => {
    if (role === "ADMIN" || role === "VENTAS") {
      const fetchCount = async () => {
        try {
          const count = await getPendingQuoteRequestsCountApi();
          setPendingCount(count);
        } catch (error) {
          logger.warn("Unable to load pending quote requests count", error);
        }
      };
      fetchCount();
      // Poll cada 60 segundos
      const interval = setInterval(fetchCount, 60000);
      return () => clearInterval(interval);
    }
  }, [role]);

  useEffect(() => {
    if (!SUPPORT_ROLES.includes(role)) return;
    const token = localStorage.getItem("bc_token");
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      socket.emit("queue:list");
    });

    socket.on("queue:update", (queue) => {
      setSupportWaitingCount(Array.isArray(queue) ? queue.length : 0);
    });

    socket.on("disconnect", () => {
      setSupportWaitingCount(0);
    });

    return () => {
      socket.disconnect();
    };
  }, [role]);

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-300/70 bg-white/70 px-4 pb-4 pt-6 text-zinc-800 shadow-xl shadow-zinc-900/5 backdrop-blur-2xl ring-1 ring-white/40 transition-all duration-300 dark:border-white/10 dark:bg-dark-800/80 dark:text-zinc-100 dark:shadow-black/30 dark:ring-white/5 motion-reduce:transition-none">
      {/* Rol actual */}
      <div className="mb-6 px-3 py-3 rounded-xl bg-white/40 dark:bg-transparent border border-white/30 dark:border-transparent backdrop-blur-xl dark:backdrop-blur-none">
        <div className="flex items-center justify-center gap-3">
          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide whitespace-nowrap leading-none">
            {roleLabel}
          </div>
          <div className="flex h-11 w-[112px] items-center justify-center overflow-hidden leading-none text-center shrink-0">
            <img
              src={logo}
              alt="Business Control"
              className="h-20 w-auto object-contain scale-150"
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
            <Item to="/polizas" icon={BadgeDollarSign}>
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
