import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { Mail } from "@icons";

export default function EmailQuoteModal({
  isOpen,
  onClose,
  quote,
  onSubmit,
  sending,
  error,
  success,
}) {
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !quote) return;

    const quoteFolio = quote.folio ? String(quote.folio).trim() : `#${quote.id ?? ""}`;
    const contactWithEmail =
      quote.contact?.email ?
        quote.contact
      : (quote.client?.contacts || []).find((c) => c.email);

    setEmailTo(contactWithEmail?.email || "");
    setEmailMessage(
      `Estimado cliente,\n\nAdjunto encontrará la cotización ${
        quoteFolio
      } por un total de $${Number(quote.total).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
      })}.\n\nQuedo a la espera de sus comentarios.\n\nSaludos,\n${
        quote.user?.full_name || "Equipo de Ventas"
      }`
    );
  }, [isOpen, quote]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ emailTo, emailMessage });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-lg shadow-2xl shadow-primary-500/10 border-light-border dark:border-white/10 !bg-light-card dark:!bg-zinc-900/95">
        <h3 className="text-xl font-semibold text-light-text-primary dark:text-white mb-4 flex items-center gap-2">
          <span className="text-primary-600 dark:text-primary-400">
            <Mail size={24} />
          </span>{" "}
          Enviar por Correo
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quote-contact-select" className="block text-xs font-medium text-light-text-secondary dark:text-zinc-400 mb-1">
              Seleccionar contacto
            </label>
            <select
              id="quote-contact-select"
              className="w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-2 text-light-text-primary dark:text-zinc-200 outline-none focus:ring-1 focus:ring-primary-500 text-sm"
              onChange={(e) => setEmailTo(e.target.value)}
              value={emailTo}
            >
              <option value="">-- Seleccionar o Escribir abajo --</option>
              {quote.client?.contacts?.map((contact) => (
                <option key={contact.id} value={contact.email || ""}>
                  {contact.full_name} ({contact.email || "Sin correo"})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Correo destino"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="ej: cliente@empresa.com"
            className="bg-light-bg dark:bg-black/30 border-light-border dark:border-white/10 text-light-text-primary dark:text-zinc-200"
            required
          />

          <div className="space-y-1">
            <label htmlFor="quote-email-message" className="block text-xs font-medium text-light-text-secondary dark:text-zinc-400">
              Mensaje
            </label>
            <textarea
              id="quote-email-message"
              className="w-full rounded-xl border border-light-border dark:border-white/10 bg-light-bg dark:bg-black/30 p-3 text-sm text-light-text-primary dark:text-zinc-200 h-32 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-light-error/10 dark:bg-red-500/10 text-light-error dark:text-red-300 text-xs border border-light-error/20 dark:border-red-500/20">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs border border-emerald-500/20">
              {success}
            </div>
          )}

          <p className="text-[10px] text-light-text-secondary dark:text-zinc-500 text-center">
            * Verificación activa con ZeroBounce antes de envío.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="shadow-lg shadow-primary-500/20 button-primary"
            >
              {sending ? "Enviando…" : "Enviar Correo"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
