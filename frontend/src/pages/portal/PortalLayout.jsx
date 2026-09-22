import { useEffect, useState, Suspense } from "react";
import {
  Navigate,
  Outlet,
  useNavigate,
  NavLink,
  useLocation,
} from "react-router-dom";
import { BadgeDollarSign, Clock, History, LayoutDashboard, BookOpen, Headphones, Settings } from "@icons";
import logo from "../../assets/logo.png";
import ThemeToggle from "../../components/layout/ThemeToggle";
import AmbientGlowBackground from "../../components/layout/AmbientGlowBackground";
import { getContactDataApi } from "../../actionsAPI/portal.api";
import { notificationService } from "../../services/notificationService";
import { logger } from "../../services/logger";

function PortalItem({ to, children, icon: Icon, matchFilter }) {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const currentFilter = search.get("filter");

  // Active logic: same path AND same filter (if matchFilter provided)
  const isActive =
    location.pathname === to.split("?")[0] &&
    (matchFilter ? currentFilter === matchFilter : true);

  return (
    <NavLink
      to={to}
      className={() =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative ${
          isActive ?
            "bg-white/80 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border border-white/80 dark:border-white/20 border-t-white dark:border-t-white/30 shadow-glass-sm ring-1 ring-white/50 dark:ring-white/10 backdrop-blur-md"
          : "text-zinc-500 dark:text-zinc-400 border border-transparent hover:border-white/70 dark:hover:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`
      }>
      <Icon size={20} strokeWidth={1.5} />
      <span>{children}</span>
    </NavLink>
  );
}

export default function PortalLayout() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("bc_portal_token");
    const savedContact = sessionStorage.getItem("bc_portal_contact");

    if (!token || !savedContact) {
      setLoading(false);
      return;
    }

    let parsedContact;
    try {
      parsedContact = JSON.parse(savedContact);
    } catch {
      sessionStorage.removeItem("bc_portal_token");
      sessionStorage.removeItem("bc_portal_contact");
      setLoading(false);
      return;
    }

    if (!parsedContact?.id) {
      sessionStorage.removeItem("bc_portal_token");
      sessionStorage.removeItem("bc_portal_contact");
      setLoading(false);
      return;
    }

    setContact(parsedContact);
    setLoading(false);

    let canceled = false;
    getContactDataApi(parsedContact.id)
      .then((freshContact) => {
        if (canceled) return;
        setContact(freshContact);
        sessionStorage.setItem(
          "bc_portal_contact",
          JSON.stringify(freshContact),
        );
      })
      .catch((error) => {
        if (canceled) return;
        logger.error("Error refreshing contact data", error);
        if (error?.code === "UNAUTHENTICATED" || error?.code === "FORBIDDEN") {
          sessionStorage.removeItem("bc_portal_token");
          sessionStorage.removeItem("bc_portal_contact");
          setContact(null);
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 transition-colors">
        Cargando portal...
      </div>
    );
  }
  if (!contact && !loading) return <Navigate to="/portal/login" />;

  const handleLogout = () => {
    notificationService.toast({ title: "Sesión cerrada correctamente" });
    sessionStorage.removeItem("bc_portal_token");
    sessionStorage.removeItem("bc_portal_contact");
    navigate("/portal/login");
  };

  return (
    <div className="min-h-screen flex relative bg-transparent text-zinc-800 dark:text-zinc-100 font-sans transition-colors">
      <AmbientGlowBackground />

      {/* ── Sidebar ── */}
      <aside className="w-64 flex flex-col pt-6 pb-4 px-4 h-screen sticky top-0 transition-all duration-150 z-40 border-r border-white/60 dark:border-white/10 bg-white/70 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass-lg dark:shadow-[8px_0_32px_rgba(0,0,0,0.5)] ring-1 ring-white/40 dark:ring-white/5">
        {/* Nombre del contacto */}
        <div className="mb-6 mx-2 px-4 py-3 rounded-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-zinc-800 backdrop-blur-sm dark:backdrop-blur-none">
          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 word-break">
            {contact.full_name}
          </div>
        </div>

        {/* Navegación */}
        <nav className="space-y-1 flex-1">
          <PortalItem to="/portal/dashboard" icon={LayoutDashboard}>
            Mis Servicios
          </PortalItem>
          <PortalItem
            to="/portal/quotes?filter=recent"
            icon={Clock}
            matchFilter="recent">
            Cotizaciones recientes
          </PortalItem>
          <PortalItem
            to="/portal/quotes?filter=older"
            icon={History}
            matchFilter="older">
            Cotizaciones anteriores
          </PortalItem>
          <PortalItem to="/portal/sales" icon={BadgeDollarSign}>
            Ventas
          </PortalItem>
          <PortalItem to="/portal/catalog" icon={BookOpen}>
            Productos
          </PortalItem>
          <PortalItem to="/portal/support" icon={Headphones}>
            Soporte
          </PortalItem>
          <PortalItem to="/portal/settings" icon={Settings}>
            Ajustes
          </PortalItem>
        </nav>

        {/* Footer con Logo */}
        <div className="mt-auto pt-6 border-t border-white/30 dark:border-white/10 flex flex-col items-center gap-2">
          <img src={logo} alt="Business Control" className="h-40" />
          <span className="text-sm font-bold text-[#1a2b4c] dark:text-zinc-400 -mt-6">
            Business Control
          </span>
        </div>
      </aside>

      {/* ── Área derecha ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar */}
        <header className="bg-[#1B4733]/85 dark:bg-emerald-950/75 backdrop-blur-xl text-white shadow-glass-sm border-b border-white/20 dark:border-emerald-800/40">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Portal</h1>
              <div className="text-xs text-white/70 mt-0.5">
                Bienvenido {contact?.full_name} • XXXX3 •{" "}
                {new Date().toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 rounded-xl bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md border border-white/80 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-white/70 dark:focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#1B4733] dark:focus:ring-offset-emerald-950 shadow-glass-sm transition-colors duration-150">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-transparent text-zinc-800 dark:text-zinc-100 transition-colors">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center p-8">
              <span className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-[#1B4733] dark:border-zinc-700 dark:border-t-emerald-400 motion-reduce:animate-none" />
            </div>
          }>
            <Outlet context={{ contact, setContact }} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
