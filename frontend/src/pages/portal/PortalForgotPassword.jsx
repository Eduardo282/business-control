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
    <div className="min-h-screen flex bg-white">
      <AuthDecorativePanel
        title="Portal del cliente"
        description="Recupera tu acceso al portal de clientes."
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
              <Mail size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a2b4c] mb-2 tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="text-[#3b4b6b]/70">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-5 rounded-xl text-sm text-center">
                <Send size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold mb-1">¡Correo enviado!</p>
                <p>
                  Si el correo <strong>{email}</strong> está registrado en el portal, recibirás un enlace para restablecer tu contraseña.
                </p>
                <p className="mt-2 text-emerald-600/70 text-xs">
                  Revisa tu bandeja de entrada y carpeta de spam.
                </p>
              </div>
              <Link
                to="/portal/login"
                className="flex items-center justify-center gap-2 w-full py-3.5 text-[#235b42] font-semibold rounded-xl border border-[#235b42]/30 hover:bg-[#235b42]/5 transition-colors">
                <ArrowLeft size={18} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
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

              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-[#235b42] text-white font-semibold rounded-xl hover:bg-[#1b4733] focus:outline-none focus:ring-2 focus:ring-[#235b42] focus:ring-offset-2 transition-all shadow-lg shadow-[#235b42]/30 disabled:opacity-50 disabled:cursor-not-allowed border border-[#1b4733]">
                {loading ? "Enviando…" : "Enviar enlace de recuperación"}
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
