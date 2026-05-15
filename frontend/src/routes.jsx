import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGate from "./components/auth/RoleGate";
import MasterPasswordGate, {
  resetMasterGranted,
} from "./components/auth/MasterPasswordGate";
import RolesAccessGate from "./components/auth/RolesAccessGate";
import { Helmet } from "react-helmet-async";
import { ThemeProvider } from "./context/ThemeContext";

const PageMeta = ({ title, desc, children }) => (
  <>
    <Helmet>
      <title>{title}</title>
      {desc && <meta name="description" content={desc} />}
    </Helmet>
    {children}
  </>
);

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Roles = lazy(() => import("./pages/auth/Roles"));
const Home = lazy(() => import("./pages/home/Home"));
const Clients = lazy(() => import("./pages/home/Clients"));
const ClientDetail = lazy(() => import("./pages/home/ClientDetail"));
const Products = lazy(() => import("./pages/home/Products"));
const ProductDetail = lazy(() => import("./pages/home/ProductDetail"));
const RegistrarProducts = lazy(() => import("./pages/home/RegistrarProducts"));
const CreateQuote = lazy(() => import("./pages/home/CreateQuote"));
const QuoteDetail = lazy(() => import("./pages/home/QuoteDetail"));
const QuoteHistory = lazy(() => import("./pages/home/QuoteHistory"));
const Policies = lazy(() => import("./pages/home/Policies"));
const AgentSupport = lazy(() => import("./pages/home/AgentSupport"));
const Layout = lazy(() => import("./pages/home/Layout"));

const PortalLogin = lazy(() => import("./pages/portal/PortalLogin"));
const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalQuotes = lazy(() => import("./pages/portal/PortalQuotes"));
const PortalCatalog = lazy(() => import("./pages/portal/PortalCatalog"));
const PortalSupport = lazy(() => import("./pages/portal/PortalSupport"));

// Guarda la última ruta visitada (excepto /register y /roles) para que MasterPasswordGate
// pueda renderizar el fondo correcto al pedir la contraseña maestra.
function LocationTracker() {
  const location = useLocation();
  useEffect(() => {
    const { pathname } = location;
    if (!["/register", "/roles"].includes(pathname)) {
      sessionStorage.setItem("last_route", pathname);
      resetMasterGranted();
    }
  }, [location]);
  return null;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LocationTracker />
        <Suspense
          fallback={
            <div className="min-h-screen w-full flex items-center justify-center text-zinc-600 text-sm">
              Cargando…
            </div>
          }>
          <Routes>
            <Route path="/login" element={<PageMeta title="Iniciar Sesión" desc="Acceso al sistema de gestión empresarial."><Login /></PageMeta>} />
            <Route
              path="/register"
              element={
                <PageMeta title="Registrar Usuario" desc="Registro de nuevos usuarios del sistema.">
                  <MasterPasswordGate>
                    <Register />
                  </MasterPasswordGate>
                </PageMeta>
              }
            />
            <Route
              path="/roles"
              element={
                <PageMeta title="Gestión de Roles" desc="Administración de roles y permisos de usuarios.">
                  <RolesAccessGate>
                    <Roles />
                  </RolesAccessGate>
                </PageMeta>
              }
            />

            {/* Rutas del portal */}
            <Route path="/portal/login" element={<PageMeta title="Portal — Iniciar Sesión" desc="Acceso al portal de clientes."><PortalLogin /></PageMeta>} />
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PageMeta title="Portal — Dashboard" desc="Panel principal del portal de clientes."><PortalDashboard /></PageMeta>} />
              <Route path="quotes" element={<PageMeta title="Portal — Cotizaciones" desc="Cotizaciones disponibles en el portal de clientes."><PortalQuotes /></PageMeta>} />
              <Route path="quotes/:id" element={<PageMeta title="Portal — Detalle Cotización" desc="Detalle de cotización en el portal."><QuoteDetail /></PageMeta>} />
              <Route path="catalog" element={<PageMeta title="Portal — Catálogo" desc="Catálogo de productos disponibles para clientes."><PortalCatalog /></PageMeta>} />
              <Route path="support" element={<PageMeta title="Portal — Soporte" desc="Chat de soporte en tiempo real para clientes."><PortalSupport /></PageMeta>} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<PageMeta title="Panel de Control" desc="Vista general del panel de control empresarial."><Home /></PageMeta>} />

                <Route element={<RoleGate allow={["ADMIN", "VENTAS"]} />}>
                  <Route path="/clientes" element={<PageMeta title="Clientes" desc="Gestión y administración de clientes registrados."><Clients /></PageMeta>} />
                  <Route path="/clientes/:id" element={<PageMeta title="Detalle de Cliente" desc="Información detallada del cliente y sus contactos."><ClientDetail /></PageMeta>} />
                </Route>

                <Route
                  element={<RoleGate allow={["ADMIN", "VENTAS", "SOPORTE"]} />}>
                  <Route path="/productos" element={<PageMeta title="Productos" desc="Catálogo de productos y servicios disponibles."><Products /></PageMeta>} />
                  <Route
                    path="/registrar-productos"
                    element={<PageMeta title="Registrar Productos" desc="Registro de nuevos productos y servicios al catálogo."><RegistrarProducts /></PageMeta>}
                  />
                  <Route path="/polizas" element={<PageMeta title="Servicios y Pólizas" desc="Gestión de pólizas y servicios activos."><Policies /></PageMeta>} />
                  <Route path="/productos/:id" element={<PageMeta title="Detalle de Producto" desc="Información detallada, precios e historial del producto."><ProductDetail /></PageMeta>} />
                  <Route
                    path="/cotizaciones/historial"
                    element={<PageMeta title="Historial de Cotizaciones" desc="Historial completo de cotizaciones generadas."><QuoteHistory /></PageMeta>}
                  />
                  <Route path="/cotizaciones/nueva" element={<PageMeta title="Nueva Cotización" desc="Creación de cotizaciones para clientes."><CreateQuote /></PageMeta>} />
                  <Route path="/cotizaciones/:id" element={<PageMeta title="Detalle de Cotización" desc="Vista detallada de la cotización con productos y totales."><QuoteDetail /></PageMeta>} />
                  <Route path="/soporte" element={<PageMeta title="Soporte" desc="Centro de soporte y chat en tiempo real con clientes."><AgentSupport /></PageMeta>} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  );
}
