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
      <div className="min-h-screen flex items-center justify-center bg-[#f6f5f0] p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-red-100 mb-4">
            <Lock size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1a2b4c] mb-2">Enlace inválido</h1>
          <p className="text-[#3b4b6b]/70 mb-6">
            Este enlace no es válido. Solicita uno nuevo desde la página de inicio de sesión.
          </p>
          <Link
            to="/portal/login"
            className="text-[#235b42] font-semibold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <AuthDecorativePanel
        title="Portal del cliente"
        description="Crea una nueva contraseña para tu cuenta."
        descriptionClassName="text-emerald-100"
      />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f6f5f0] relative">
        <div
          className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
          }}></div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[#235b42] mb-4 shadow-lg shadow-[#235b42]/25">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a2b4c] mb-2 tracking-tight">
              Nueva contraseña
            </h1>
            <p className="text-[#3b4b6b]/70">
              Ingresa tu nueva contraseña para el portal
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-5 rounded-xl text-sm text-center">
                <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold mb-1">¡Contraseña actualizada!</p>
                <p>Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1a2b4c] mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d6d4c9] bg-white shadow-sm text-[#1a2b4c] placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
                    required
                    minLength={6}
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
                {loading ? "Guardando…" : "Guardar nueva contraseña"}
              </button>

              <div className="text-center">
                <Link
                  to="/portal/login"
                  className="text-sm text-[#235b42] hover:underline font-medium inline-flex items-center gap-1">
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
