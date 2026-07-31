import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "@icons";
import { requestPortalPasswordResetApi } from "../../actionsAPI/portal.api";
import AuthDecorativePanel from "../../components/ui/AuthDecorativePanel";

export default function PortalForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPortalPasswordResetApi(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      <AuthDecorativePanel
        title="Portal del cliente"
        description="Recupera tu acceso al portal de clientes."
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
              <Mail size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a2b4c] dark:text-zinc-100 mb-2 tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="text-[#3b4b6b]/70 dark:text-zinc-400">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-6 py-5 rounded-xl text-sm text-center">
                <Send size={24} className="mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold mb-1">¡Correo enviado!</p>
                <p>
                  Si el correo <strong>{email}</strong> está registrado en el portal, recibirás un enlace para restablecer tu contraseña.
                </p>
                <p className="mt-2 text-emerald-700/80 dark:text-emerald-300/80 text-xs">
                  Revisa tu bandeja de entrada y carpeta de spam.
                </p>
              </div>
              <Link
                to="/portal/login"
                className="flex items-center justify-center gap-2 w-full py-3.5 text-[#235b42] dark:text-emerald-400 font-semibold rounded-xl border border-[#235b42]/30 dark:border-emerald-700 hover:bg-[#235b42]/5 dark:hover:bg-emerald-500/10 hover:border-[#235b42]/50 dark:hover:border-emerald-500 transition-colors">
                <ArrowLeft size={18} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
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

              {error && (
                <div role="alert" className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-[#235b42] dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-[#1b4733] dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-[#235b42] dark:focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#f6f5f0] dark:focus:ring-offset-zinc-950 transition-all shadow-lg shadow-[#235b42]/30 dark:shadow-black/30 disabled:bg-[#235b42]/60 dark:disabled:bg-emerald-950 disabled:text-white/80 dark:disabled:text-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed border border-[#1b4733] dark:border-emerald-600 dark:disabled:border-emerald-900">
                {loading ? "Enviando…" : "Enviar enlace de recuperación"}
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
