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
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Ajustes</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Gestiona la seguridad y preferencias de tu cuenta.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-2xl p-6 shadow-sm">
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
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
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
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
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
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#235b42] focus:border-transparent transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#235b42] text-white font-medium rounded-xl hover:bg-[#1b4733] focus:ring-2 focus:ring-offset-2 focus:ring-[#235b42] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={18} />
              {loading ? "Guardando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
