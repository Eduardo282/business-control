import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { Globe, X } from "@icons";

export default function SendToPortalModal({
  isOpen,
  onClose,
  quote,
  onSubmit,
  toggleLoading,
  portalError,
  setPortalError,
}) {
  const [selectedContactId, setSelectedContactId] = useState("");

  const clientContacts = quote?.client?.contacts || [];
  const selectedPortalContact = clientContacts.find(
    (c) => String(c.id) === String(selectedContactId)
  );
  const selectedPortalContactHasAccess = Boolean(selectedPortalContact?.has_portal_access);

  useEffect(() => {
    if (!isOpen || !quote) return;
    const firstPortalEnabledContact = clientContacts.find((c) => Boolean(c?.has_portal_access));
    setSelectedContactId(firstPortalEnabledContact?.id || "");
    setPortalError(
      firstPortalEnabledContact
        ? ""
        : "No hay contactos con portal habilitado para enviar esta cotización."
    );
  }, [isOpen, quote]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedContactId) {
      setPortalError("Debes seleccionar un contacto.");
      return;
    }
    onSubmit(selectedContactId, selectedPortalContact);
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={() => !toggleLoading && onClose()}
        className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[2px]"
      />

      <Card className="relative w-full max-w-lg overflow-hidden !bg-white dark:!bg-dark-900 border border-zinc-200 dark:border-dark-700 shadow-2xl shadow-zinc-900/20">
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-dark-700 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-[#1B4733]/10 text-[#1B4733] inline-flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                Enviar a Portal
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-sm leading-relaxed">
                Selecciona el contacto que recibirá acceso a esta cotización en su portal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={toggleLoading}
            className="size-8 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:dark:bg-dark-800 hover:text-zinc-700 hover:dark:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 bg-white dark:bg-dark-900">
          <div>
            <label htmlFor="portal-contact-select" className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Seleccionar contacto
            </label>
            <select
              id="portal-contact-select"
              className="w-full rounded-xl border border-zinc-300 dark:border-dark-700 bg-zinc-50/80 dark:bg-dark-800/80 px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#1B4733]/20 focus:border-[#1B4733] transition-colors"
              onChange={(e) => {
                setSelectedContactId(e.target.value);
                setPortalError("");
              }}
              value={selectedContactId}
            >
              <option value="">-- Seleccionar --</option>
              {clientContacts.map((contact) => (
                <option
                  key={contact.id}
                  value={contact.id}
                  disabled={!contact.has_portal_access}
                >
                  {contact.full_name} ({contact.email || "Sin correo"})
                  {!contact.has_portal_access ? " - portal no habilitado" : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
              Solo se puede enviar a contactos con portal habilitado.
            </p>
          </div>

          {portalError && (
            <div className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
              {portalError}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-dark-700 bg-zinc-50/80 dark:bg-dark-800/80 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={toggleLoading}
            className="!bg-white dark:!bg-dark-900 !border !border-zinc-200 dark:!border-dark-700 !text-zinc-700 dark:!text-zinc-300 hover:!bg-zinc-100 hover:dark:!bg-dark-800 disabled:!opacity-50"
          >
            Cancelar
          </Button>
          <button
            onClick={handleConfirm}
            disabled={toggleLoading || !selectedPortalContactHasAccess}
            className="!bg-[#2B7FBE] hover:!bg-[#236EA8] !text-white !rounded-2xl !px-6 !py-2.5 shadow-[0_7px_14px_rgba(43,127,190,0.32)] hover:shadow-[0_9px_18px_rgba(43,127,190,0.38)] !transition-all !duration-150 disabled:!opacity-50 disabled:!cursor-not-allowed"
          >
            {toggleLoading ? "Enviando…" : "Confirmar y Enviar"}
          </button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
