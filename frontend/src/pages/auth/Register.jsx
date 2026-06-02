import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Shield, CircleHelp } from "@icons";
import { registerUserApi, verifyMasterPasswordApi } from "../../actionsAPI/auth.api";
import { notificationService } from "../../services/notificationService";
import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  isStrongPassword,
} from "../../../../shared/validation";
import AuthDecorativePanel from "../../components/ui/AuthDecorativePanel";
import logo from "../../assets/logo.png";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoleFromRoles = location.state?.selectedRole;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState(
    () =>
      selectedRoleFromRoles ||
      sessionStorage.getItem("selected_register_role") ||
      "",
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRoleFromRoles) return;

    setRoleName(selectedRoleFromRoles);
    sessionStorage.setItem("selected_register_role", selectedRoleFromRoles);
  }, [selectedRoleFromRoles]);

  const goToRolesRegister = async () => {
    const result = await notificationService.passwordPrompt({
      title:
        '<span style="color:#162A42;font-size:1.25rem;font-weight:700">🔒 Acceso a Roles</span>',
      html: `
        <p style="color:#6b7280;font-size:0.9rem;">
          Ingresar contraseña para continuar al registro de roles.
        </p>
      `,
      input: "password",
      inputPlaceholder: "Escribe tu contraseña...",
      inputAttributes: {
        autocomplete: "new-password",
      },
      confirmButtonText: "Ingresar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: "#162A42",
      cancelButtonColor: "#9ca3af",
      inputValidator: (val) => {
        if (!val) return "Por favor ingresa la contraseña maestra.";
      },
    });

    if (result.isConfirmed) {
      const isCorrect = await verifyMasterPasswordApi(result.value);
      if (isCorrect) {
        const token = Date.now() + "_" + Math.random();
        sessionStorage.setItem("roles_access_key", token);
        navigate("/roles", { state: { roles_access_key: token } });
      } else {
        notificationService.error(
          "Incorrect password",
          "You do not have permission to access this section.",
        );
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isStrongPassword(password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      if (!roleName) {
        setError("Selecciona un rol desde el icono de ayuda para continuar");
        setLoading(false);
        return;
      }

      await registerUserApi(fullName, email, telefono, password, roleName);
      setSuccess(
        `Usuario "${fullName}" registrado exitosamente con rol "${roleName}"`,
      );
      setFullName("");
      setEmail("");
      setTelefono("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <AuthDecorativePanel
        title="Configuración de Usuarios"
        description="Modulo de Actualizacion de credenciales de acceso de cada rol del sistema."
      />

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F1F4F8] relative">
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
            <h1 className="text-3xl font-semibold text-[#1a2b4c] mb-2 tracking-tight">
              Configurar Usuario
            </h1>
            <p className="text-[#3b4b6b]/70">
              Actualiza las credenciales del rol seleccionado
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

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
                  placeholder="correo@empresa.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 55 1234 5678"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465] focus:border-transparent transition-all"
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
                  placeholder="EJ: &q/N,sKz"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                Selecciona un rol
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] shadow-sm text-[#1a2b4c] focus:outline-none transition-all min-h-[52px] flex items-center ${
                      roleName ? "bg-white" : "bg-zinc-100 text-zinc-400"
                    }`}
                    aria-live="polite">
                    {roleName || "Sin rol seleccionado"}
                  </div>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={goToRolesRegister}
                    className="group relative h-[52px] w-[52px] rounded-xl border border-[#d6d4c9] bg-white text-[#1a2b4c] hover:bg-zinc-50 transition-colors flex items-center justify-center"
                    title="Click para registrar un nuevo rol"
                    aria-label="Registrar nuevo rol">
                    <CircleHelp size={20} />
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#2277B4] shadow-[0_0_0_2px_white] animate-pulse"></span>
                  </button>
                  <span className="mt-1 text-[11px] leading-none text-[#1a2b4c]">
                    Crear rol
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !roleName}
              className="w-full py-3.5 mt-2 bg-[#2277B4] text-white font-semibold rounded-xl hover:bg-[#125280] focus:outline-none focus:ring-2 focus:ring-[#2277B4] focus:ring-offset-2 transition-all shadow-lg shadow-[#2277B4]/20 disabled:opacity-50 disabled:cursor-not-allowed border border-[#2277B4]">
              {loading ?
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></span>
                  Actualizando…
                </span>
              : "Registrar Usuario"}
            </button>

            <div className="text-center pt-6">
              <Link
                to="/login"
                className="text-sm text-[#1a2b4c] hover:underline font-bold">
                ← Volver al Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
