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
      title: "🔒 Acceso a Roles",
      html: `
        <p class="swal-theme-copy">
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
      customClass: {
        htmlContainer: "swal-theme-copy",
      },
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
    <div className="min-h-screen flex bg-white dark:bg-dark-900">
      <AuthDecorativePanel
        title="Configuración de Usuarios"
        description="Modulo de Actualizacion de credenciales de acceso de cada rol del sistema."
      />

      {/* Lado derecho - Formulario */}
      <div className="relative flex w-full items-center justify-center bg-[#F1F4F8] p-8 dark:bg-dark-800 lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-screen"
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
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[#1a2b4c] dark:text-zinc-100">
              Configurar Usuario
            </h1>
            <p className="text-[#3b4b6b]/70 dark:text-zinc-400">
              Actualiza las credenciales del rol seleccionado
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200">
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
                  className="w-full rounded-xl border border-[#94a3b8] bg-white py-3.5 pl-11 pr-4 text-[#1a2b4c] shadow-sm transition-all placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] dark:border-white/20 dark:bg-dark-700 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200">
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
                  className="w-full rounded-xl border border-[#94a3b8] bg-white py-3.5 pl-11 pr-4 text-[#1a2b4c] shadow-sm transition-all placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] dark:border-white/20 dark:bg-dark-700 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200">
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
                  className="w-full rounded-xl border border-[#94a3b8] bg-white py-3.5 pl-11 pr-4 text-[#1a2b4c] shadow-sm transition-all placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] dark:border-white/20 dark:bg-dark-700 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200">
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
                  className="w-full rounded-xl border border-[#94a3b8] bg-white py-3.5 pl-11 pr-4 text-[#1a2b4c] shadow-sm transition-all placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] dark:border-white/20 dark:bg-dark-700 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200">
                Selecciona un rol
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div
                    className={`flex min-h-[52px] w-full items-center rounded-xl border border-[#94a3b8] py-3.5 pl-11 pr-4 text-[#1a2b4c] shadow-sm transition-all dark:border-white/20 dark:text-zinc-100 ${
                      roleName ? "bg-white dark:bg-dark-700" : "bg-zinc-100 text-zinc-500 dark:bg-dark-700/70 dark:text-zinc-400"
                    }`}
                    aria-live="polite">
                    {roleName || "Sin rol seleccionado"}
                  </div>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={goToRolesRegister}
                    className="group relative flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-[#94a3b8] bg-white text-[#1a2b4c] transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] dark:border-white/20 dark:bg-dark-700 dark:text-zinc-100 dark:hover:bg-dark-700/70 dark:focus-visible:ring-blue-400"
                    title="Click para registrar un nuevo rol"
                    aria-label="Registrar nuevo rol">
                    <CircleHelp size={20} />
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-[#2277B4] shadow-[0_0_0_2px_white] dark:bg-blue-400 dark:shadow-[0_0_0_2px_#1a1d2d] motion-reduce:animate-none"></span>
                  </button>
                  <span className="mt-1 text-[11px] leading-none text-[#1a2b4c] dark:text-zinc-300">
                    Crear rol
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !roleName}
              className="mt-2 w-full rounded-xl border border-[#2277B4] bg-[#2277B4] py-3.5 font-semibold text-white shadow-lg shadow-[#2277B4]/20 transition-all hover:bg-[#125280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F8] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-800 motion-reduce:transition-none">
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
                className="text-sm font-bold text-[#1a2b4c] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] dark:text-zinc-200 dark:focus-visible:ring-blue-400">
                ← Volver al Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
