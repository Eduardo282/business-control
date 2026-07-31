import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, CheckCircle } from "@icons";
import { resetPortalPasswordApi } from "../../actionsAPI/portal.api";
import AuthDecorativePanel from "../../components/ui/AuthDecorativePanel";

export default function PortalResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await resetPortalPasswordApi(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/portal/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f5f0] dark:bg-zinc-950 p-8 transition-colors">
        <div className="text-center max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white/70 dark:bg-zinc-900 p-8 shadow-sm dark:shadow-black/30">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-red-100 dark:bg-red-500/15 mb-4">
            <Lock size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1a2b4c] dark:text-zinc-100 mb-2">Enlace inválido</h1>
          <p className="text-[#3b4b6b]/70 dark:text-zinc-400 mb-6">
            Este enlace no es válido. Solicita uno nuevo desde la página de inicio de sesión.
          </p>
          <Link
            to="/portal/login"
            className="text-[#235b42] dark:text-emerald-400 font-semibold hover:text-[#1b4733] dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      <AuthDecorativePanel
        title="Portal del cliente"
        description="Crea una nueva contraseña para tu cuenta."
        descriptionClassName="text-emerald-100 dark:text-emerald-200"
      />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f6f5f0] dark:bg-zinc-950 relative transition-colors">
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.08] mix-blend-multiply dark:mix-blend-soft-light pointer-events-none"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
          }}></div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[#235b42] dark:bg-emerald-700 mb-4 shadow-lg shadow-[#235b42]/25 dark:shadow-black/30">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a2b4c] dark:text-zinc-100 mb-2 tracking-tight">
              Nueva contraseña
            </h1>
            <p className="text-[#3b4b6b]/70 dark:text-zinc-400">
              Ingresa tu nueva contraseña para el portal
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-6 py-5 rounded-xl text-sm text-center">
                <CheckCircle size={24} className="mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold mb-1">¡Contraseña actualizada!</p>
                <p>Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-black/20 text-[#1a2b4c] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1a2b4c] dark:text-zinc-200 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-black/20 text-[#1a2b4c] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
                    required
                    minLength={6}
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
                {loading ? "Guardando…" : "Guardar nueva contraseña"}
              </button>

              <div className="text-center">
                <Link
                  to="/portal/login"
                  className="text-sm text-[#235b42] dark:text-emerald-400 hover:text-[#1b4733] dark:hover:text-emerald-300 hover:underline font-medium inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
