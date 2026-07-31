import { useState } from "react";
import { Lock, Save } from "@icons";
import { changePortalPasswordApi } from "../../actionsAPI/portal.api";
import { notificationService } from "../../services/notificationService";
import { useOutletContext } from "react-router-dom";

export default function PortalSettings() {
  const { contact } = useOutletContext();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await changePortalPasswordApi(contact.id, currentPassword, newPassword);
      notificationService.toast({ title: "Contraseña actualizada exitosamente" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 text-zinc-800 dark:text-zinc-100">
      <style>{`
        .portal-settings-input:-webkit-autofill,
        .portal-settings-input:-webkit-autofill:hover,
        .portal-settings-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset;
          -webkit-text-fill-color: #18181b;
          caret-color: #18181b;
        }
        .dark .portal-settings-input:-webkit-autofill,
        .dark .portal-settings-input:-webkit-autofill:hover,
        .dark .portal-settings-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #09090b inset;
          -webkit-text-fill-color: #f4f4f5;
          caret-color: #f4f4f5;
        }
      `}</style>
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Ajustes</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Gestiona la seguridad y preferencias de tu cuenta.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Lock size={20} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Cambiar Contraseña
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="portal-settings-input w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="portal-settings-input w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="portal-settings-input w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#235b42]/30 dark:focus:ring-emerald-400/30 focus:border-[#235b42] dark:focus:border-emerald-400 transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div role="alert" className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#235b42] dark:bg-emerald-700 text-white font-medium rounded-xl hover:bg-[#1b4733] dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#235b42] dark:focus:ring-emerald-400 focus:ring-offset-white dark:focus:ring-offset-zinc-900 transition-all disabled:bg-[#235b42]/60 dark:disabled:bg-emerald-950 disabled:text-white/80 dark:disabled:text-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed">
              <Save size={18} />
              {loading ? "Guardando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
