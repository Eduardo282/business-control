import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, ArrowRight, ArrowLeft } from "@icons";
import Swal from "sweetalert2";
import {
  loginContactApi,
  getContactDataApi,
} from "../../actionsAPI/portal.api";
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

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "success",
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
    <div className="min-h-screen flex bg-white">
      {/* Lado izquierdo - Imagen corporativa */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#4A6B8A] to-[#162A42] relative overflow-hidden z-20 shadow-[15px_0_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center justify-center w-full px-12 relative z-10">
          <img
            src={logo}
            alt="Business Control"
            className="w-80 mb-8 drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
          />
          <h2 className="text-white text-3xl font-semibold text-center mb-4">
            Portal del cliente
          </h2>
          <p className="text-emerald-100 text-center text-lg max-w-md leading-relaxed">
            Modal de administracion de tus servicios, licencias y cotizaciones.
          </p>
        </div>

        {/* Decoración - Burbujas 3D Reflejadas (Esquinas) */}
        {/* Burbuja Esquina Superior Derecha */}
        <div
          className="absolute top-0 right-0 w-[16rem] h-[16rem] rounded-full mix-blend-overlay pointer-events-none translate-x-[10%] -translate-y-[10%]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 40%, transparent 70%)",
            boxShadow:
              "inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.2)",
            filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.4))",
          }}></div>

        {/* Burbuja Esquina Inferior Izquierda */}
        <div
          className="absolute bottom-0 left-0 w-[16rem] h-[16rem] rounded-full mix-blend-overlay pointer-events-none -translate-x-[10%] translate-y-[10%]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.05) 50%, transparent 70%)",
            boxShadow:
              "inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.2)",
            filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.5))",
          }}></div>
      </div>

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
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
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
