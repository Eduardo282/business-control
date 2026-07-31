import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, ArrowRight, ArrowLeft } from "@icons";
import {
  loginContactApi,
  getContactDataApi,
} from "../../actionsAPI/portal.api";
import AuthDecorativePanel from "../../components/ui/AuthDecorativePanel";
import { notificationService } from "../../services/notificationService";
import logo from "../../assets/logo.png";

export default function PortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, contact } = await loginContactApi(email, password);
      sessionStorage.setItem("bc_portal_token", token);
      const fullContactData = await getContactDataApi(contact.id);
      sessionStorage.setItem(
        "bc_portal_contact",
        JSON.stringify(fullContactData),
      );

      notificationService.toast({
        title: `Bienvenido al portal, ${fullContactData.full_name}`,
      });

      navigate("/portal/dashboard");
    } catch (err) {
      setError(err.message);
      localStorage.removeItem("bc_portal_token");
      sessionStorage.removeItem("bc_portal_token");
      sessionStorage.removeItem("bc_portal_contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      <AuthDecorativePanel
        title="Portal del cliente"
        description="Modal de administracion de tus servicios, licencias y cotizaciones."
        descriptionClassName="text-emerald-100 dark:text-emerald-200"
      />

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f6f5f0] dark:bg-zinc-950 relative transition-colors">
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.08] mix-blend-multiply dark:mix-blend-soft-light pointer-events-none"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
          }}></div>
        <div className="w-full max-w-md relative z-10">
          {/* Logo para móvil */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src={logo}
              alt="Business Control"
              className="w-48 drop-shadow-md"
            />
          </div>

          {/* Encabezado */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[#235b42] dark:bg-emerald-700 mb-4 shadow-lg shadow-[#235b42]/25 dark:shadow-black/30">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a2b4c] dark:text-zinc-100 mb-2 tracking-tight">
              Portal del cliente
            </h1>
            <p className="text-[#3b4b6b]/70 dark:text-zinc-400">
              Ingresa con tu correo y contraseña asignada
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-black/20 text-[#1a2b4c] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-black/20 text-[#1a2b4c] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#235b42] dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-[#1b4733] dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-[#235b42] dark:focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#f6f5f0] dark:focus:ring-offset-zinc-950 transition-all shadow-lg shadow-[#235b42]/30 dark:shadow-black/30 disabled:bg-[#235b42]/60 dark:disabled:bg-emerald-950 disabled:text-white/80 dark:disabled:text-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed border border-[#1b4733] dark:border-emerald-600 dark:disabled:border-emerald-900">
              {loading ?
                "Verificando…"
              : <span className="flex items-center justify-center gap-2">
                  Acceder al Portal <ArrowRight size={18} />
                </span>
              }
            </button>
            <div className="text-center pt-2">
              <Link 
                to="/portal/forgot-password" 
                className="text-sm text-[#235b42] dark:text-emerald-400 hover:text-[#1b4733] dark:hover:text-emerald-300 hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#d6d4c9] dark:border-zinc-800 text-center space-y-3">
            <p className="text-xs text-[#5e6b82] dark:text-zinc-400 font-medium">
              ¿Problemas para ingresar? Contacta a tu ejecutivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
