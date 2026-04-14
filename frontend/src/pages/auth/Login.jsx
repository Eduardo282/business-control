import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  UserPlus,
  Building2,
  ArrowRight,
} from "@icons";
import Swal from "sweetalert2";
import { loginApi } from "../../actionsAPI/auth.api";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\+\-=\[\]{}|;:,.<>?/]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos (!@#$%^&*...).",
      );
      return;
    }

    setLoading(true);

    try {
      const res = await loginApi(email, password);
      localStorage.setItem("bc_token", res.token);

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });

      Toast.fire({
        icon: "success",
        title: `Bienvenido, ${res.user.full_name}`,
      });

      setUser(res.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Lado izquierdo - Imagen corporativa */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#4A6B8A] to-[#162A42] relative overflow-hidden z-20 shadow-[15px_0_30px_-5px_rgba(0,0,0,0.5)]">
        {/* Logo grande centrado */}
        <div className="flex flex-col items-center justify-center w-full px-12 relative z-10">
          <img
            src={logo}
            alt="Business Control"
            className="w-80 mb-8 drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
          />
          <h2 className="text-white text-3xl font-bold text-center mb-4">
            Sistema Empresarial
          </h2>
          <p className="text-blue-100 text-center text-lg max-w-md leading-relaxed">
            Modulo de administracion
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F1F4F8] relative">
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
            <h1 className="text-3xl font-extrabold text-[#1a2b4c] mb-2 tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-[#3b4b6b]/70">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={submit} className="space-y-6">
            {/* Campo de correo electrónico */}
            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="EJ: &q/N,sKz"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="submit"
                disabled={loading}
                className="group col-span-2 flex min-h-[68px] items-center justify-between rounded-[18px] border border-[#2277B4] bg-gradient-to-r from-[#2277B4] to-[#165d92] px-4 py-3 text-left text-white shadow-[0_16px_28px_-22px_rgba(34,119,180,0.95)] transition-all hover:-translate-y-0.5 hover:from-[#1e6da5] hover:to-[#114a73] focus:outline-none focus:ring-2 focus:ring-[#2277B4] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                <span className="pr-3">
                  <span className="block text-sm font-semibold">
                    Iniciar Sesión
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/14 text-white">
                  {loading ?
                    <span className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></span>
                  : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  }
                </span>
              </button>

              <Link
                to="/register"
                className="group flex min-h-[92px] justify-center items-center rounded-[18px] border border-[#d8dde7] bg-white px-3 py-3 text-left shadow-[0_14px_24px_-22px_rgba(26,43,76,0.65)] transition-all hover:-translate-y-0.5 hover:border-[#2277B4]/35 hover:shadow-[0_18px_30px_-22px_rgba(34,119,180,0.35)] focus:outline-none focus:ring-2 focus:ring-[#2277B4] focus:ring-offset-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2277B4]/12 text-[#2277B4] transition-colors group-hover:bg-[#2277B4]/18">
                  <UserPlus className="h-4 w-4" />
                </span>

                <span className="block text-[13px] font-semibold leading-tight text-[#1a2b4c]">
                  Crear Nueva Cuenta
                </span>
              </Link>

              <Link
                to="/portal/login"
                className="group flex min-h-[92px] justify-center items-center rounded-[18px] border border-[#1B4733] bg-[#1B4733] px-3 py-3 text-left shadow-[0_16px_28px_-24px_rgba(27,71,51,0.95)] transition-all hover:-translate-y-0.5 hover:bg-[#163a2b] hover:shadow-[0_20px_32px_-22px_rgba(27,71,51,1)] focus:outline-none focus:ring-2 focus:ring-[#1B4733] focus:ring-offset-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 text-white transition-colors group-hover:bg-white/18">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-tight text-white">
                    Ingresar al Portal del cliente
                  </span>
                </span>
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-[#5e6b82] font-medium">
            <span>Business Control © 2026 — Sistema Empresarial</span>
          </div>
        </div>
      </div>
    </div>
  );
}
