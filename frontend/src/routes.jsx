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
    if (!["/register", "/roles"].includes(location.pathname)) {
      sessionStorage.setItem("last_route", location.pathname);
      resetMasterGranted();
    }
  }, [location.pathname]);
  return null;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <LocationTracker />
      <Suspense
        fallback={
          <div className="min-h-screen w-full flex items-center justify-center text-slate-600 text-sm">
            Cargando...
          </div>
        }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/register"
            element={
              <MasterPasswordGate>
                <Register />
              </MasterPasswordGate>
            }
          />
          <Route
            path="/roles"
            element={
              <RolesAccessGate>
                <Roles />
              </RolesAccessGate>
            }
          />

          {/* Rutas del portal */}
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="quotes" element={<PortalQuotes />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="catalog" element={<PortalCatalog />} />
            <Route path="support" element={<PortalSupport />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />

              <Route element={<RoleGate allow={["ADMIN", "VENTAS"]} />}>
                <Route path="/clientes" element={<Clients />} />
                <Route path="/clientes/:id" element={<ClientDetail />} />
              </Route>

              <Route
                element={<RoleGate allow={["ADMIN", "VENTAS", "SOPORTE"]} />}>
                <Route path="/productos" element={<Products />} />
                <Route
                  path="/registrar-productos"
                  element={<RegistrarProducts />}
                />
                <Route path="/polizas" element={<Policies />} />
                <Route path="/productos/:id" element={<ProductDetail />} />
                <Route
                  path="/cotizaciones/historial"
                  element={<QuoteHistory />}
                />
                <Route path="/cotizaciones/nueva" element={<CreateQuote />} />
                <Route path="/cotizaciones/:id" element={<QuoteDetail />} />
                <Route path="/soporte" element={<AgentSupport />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
