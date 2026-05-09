import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "./assets/logo.png";
import { getPendingQuoteRequestsCountApi } from "../../actionsAPI/quotes.api";
import {
  LayoutDashboard,
  FileCheck,
  Package,
  PackagePlus,
  History,
  FileText,
  Headphones,
} from "@icons";

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
        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative ${
          isActive && !shouldDisableActive ?
            "bg-white dark:bg-white/10 text-gray-900 dark:text-slate-100 shadow-[0_5px_5px_0px_#00000050] ring-1 ring-light-border/50 dark:ring-white/10"
          : "text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-100"
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
  const roleLabel = role === "ADMIN" ? "Administrador" : role;

  useEffect(() => {
    if (role === "ADMIN" || role === "VENTAS") {
      const fetchCount = async () => {
        try {
          const count = await getPendingQuoteRequestsCountApi();
          setPendingCount(count);
        } catch (e) {}
      };
      fetchCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    }
  }, [role]);

  return (
    <aside className="w-64 flex flex-col pt-6 pb-4 px-4 h-screen sticky top-0 transition-all duration-300 z-40 border-r border-white/30 dark:border-white/10 bg-white/35 dark:bg-dark-800/60 backdrop-blur-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/30 ring-1 ring-white/20 dark:ring-white/5">
      {/* Rol actual */}
      <div className="mb-6 px-3 py-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-3">
          <div className="text-sm font-bold text-gray-800 dark:text-slate-200 tracking-wide whitespace-nowrap leading-none">
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
      <nav className="space-y-1 flex-1">
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
            <Item to="/polizas" icon={FileCheck}>
              Servicios y Pólizas
            </Item>
            <Item
              to="/cotizaciones/historial"
              icon={History}
              badge={pendingCount}>
              Historial de Cotizaciones
            </Item>
            <Item to="/soporte" icon={Headphones}>
              Soporte
            </Item>
          </>
        )}
      </nav>

      <div className="pt-4 text-center">
        <span className="text-xs font-bold text-[#1a2b4c] dark:text-slate-400 whitespace-nowrap">
          Business Control 
        </span>
      </div>
    </aside>
  );
}
