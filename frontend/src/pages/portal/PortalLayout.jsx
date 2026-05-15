import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useNavigate,
  NavLink,
  useLocation,
} from "react-router-dom";
import Swal from "sweetalert2";
import { Clock, History, LayoutDashboard, BookOpen, Headphones } from "@icons";
import logo from "../../components/layout/assets/logo.png";
import ThemeToggle from "../../components/layout/ThemeToggle";
import { getContactDataApi } from "../../actionsAPI/portal.api";

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
            "bg-white dark:bg-white/10 text-zinc-900 dark:text-zinc-100 shadow-[0_5px_5px_0px_#00000050] ring-1 ring-white/50 dark:ring-white/10"
          : "text-zinc-500 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100"
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

    const parsedContact = JSON.parse(savedContact);
    setContact(parsedContact);
    setLoading(false);

    if (!parsedContact?.id) return;
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
        console.error("Error refreshing contact data", error);
      });

    return () => {
      canceled = true;
    };
  }, []);

  if (loading) return <div>Cargando portal...</div>;
  if (!contact && !loading) return <Navigate to="/portal/login" />;

  const handleLogout = () => {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
    Toast.fire({ icon: "success", title: "Sesión cerrada correctamente" });
    sessionStorage.removeItem("bc_portal_token");
    sessionStorage.removeItem("bc_portal_contact");
    navigate("/portal/login");
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-dark-950 text-zinc-800 dark:text-zinc-100 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex flex-col pt-6 pb-4 px-4 h-screen sticky top-0 transition-all duration-300 z-40 border-r border-white/30 dark:border-white/10 bg-white/35 dark:bg-dark-800/60 backdrop-blur-2xl shadow-xl shadow-zinc-900/5 dark:shadow-black/30 ring-1 ring-white/20 dark:ring-white/5">
        {/* Nombre del contacto */}
        <div className="mb-6 mx-2 px-4 py-3 rounded-xl bg-white/40 dark:bg-transparent border border-white/30 dark:border-transparent backdrop-blur-xl dark:backdrop-blur-none">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">
            Cliente
          </div>
          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
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
            Cotizaciones
          </PortalItem>
          <PortalItem to="/portal/catalog" icon={BookOpen}>
            Productos
          </PortalItem>
          <PortalItem to="/portal/support" icon={Headphones}>
            Soporte
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-[#1B4733] text-white shadow-md">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Portal del Cliente</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 rounded-xl bg-white dark:bg-dark-800 border border-[#CBD5E1] dark:border-dark-700 hover:bg-[#F8FAFC] hover:dark:bg-dark-700 hover:border-[#B8C6D8] shadow-sm transition-colors duration-150">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
          <Outlet context={{ contact }} />
        </main>
      </div>
    </div>
  );
}
