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
        title: `Welcome to the portal, ${fullContactData.full_name}`,
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
    <div className="min-h-screen flex bg-white">
      <AuthDecorativePanel
        title="Portal del cliente"
        description="Modal de administracion de tus servicios, licencias y cotizaciones."
        descriptionClassName="text-emerald-100"
      />

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f6f5f0] relative">
        <div
          className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none"
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
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[#235b42] mb-4 shadow-lg shadow-[#235b42]/25">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a2b4c] mb-2 tracking-tight">
              Portal del cliente
            </h1>
            <p className="text-[#3b4b6b]/70">
              Ingresa con tu correo y contraseña asignada
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#235b42] text-white font-semibold rounded-xl hover:bg-[#1b4733] focus:outline-none focus:ring-2 focus:ring-[#235b42] focus:ring-offset-2 transition-all shadow-lg shadow-[#235b42]/30 disabled:opacity-50 disabled:cursor-not-allowed border border-[#1b4733]">
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
                className="text-sm text-[#235b42] hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#d6d4c9] text-center space-y-3">
            <p className="text-xs text-[#5e6b82] font-medium">
              ¿Problemas para ingresar? Contacta a tu ejecutivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
