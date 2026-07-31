import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Tag } from "@icons";
import { updateContactApi } from "../../../actionsAPI/contacts.api";
import { notificationService } from "../../../services/notificationService";

export const ManagePortalModal = ({ contact, onClose }) => {
  const [access, setAccess] = useState(contact.has_portal_access);
  const [saving, setSaving] = useState(false);

  const generatePassword = () => {
    // Formato: 20240131 + 6 caracteres aleatorios (ej. 20240131ABC123)
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(-6).toUpperCase();
    return `${date}${random}`;
  };

  const handleSaveAccess = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newAccess = !access;
      let generatedPass = undefined;

      if (newAccess) {
        generatedPass = generatePassword();
      }

      await updateContactApi(contact.id, {
        has_portal_access: newAccess,
        portal_password: generatedPass,
      });

      if (newAccess) {
        notificationService.success(
          "Acceso habilitado",
          `${contact.full_name} ya tiene acceso al portal.`
        );
      } else {
        notificationService.success(
          "Acceso revocado",
          "El acceso al portal fue revocado correctamente."
        );
      }
      setAccess(newAccess);
      setSaving(false);
      onClose(true);
      return;
    } catch (e) {
      notificationService.error(
        "Error",
        e.message || "No se pudo actualizar el acceso del portal."
      );
      setSaving(false);
    }
  };

  return createPortal(
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 bg-black/50 dark:bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-lg overflow-hidden flex flex-col border border-transparent dark:border-dark-700">
        {/* Header del modal */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-700 flex items-center justify-between bg-[#1a2b4c] dark:bg-blue-950">
          <div>
            <h2 className="text-lg font-semibold text-white dark:text-white flex items-center gap-2">
              Portal del Contacto
            </h2>
            <div className="text-sm text-zinc-300 dark:text-zinc-300 mt-1">
              {" "}
              <span className="text-white dark:text-white font-medium">
                {contact.full_name}
              </span>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="size-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-400 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/40">
            <X size={18} />
          </button>
        </div>

        {/* Body del modal */}
        <div className="p-6 space-y-6 bg-zinc-50/50 dark:bg-dark-900/60">
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 shadow-sm dark:shadow-black/20 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 size-32 bg-[#2277B4]/10 dark:bg-blue-400/10 blur-2xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>

            <h3 className="font-semibold text-[#1a2b4c] dark:text-zinc-100 mb-6 flex items-center gap-2 relative z-10">
              <span className="text-lg text-[#2277B4] dark:text-blue-300">
                <Lock size={20} />
              </span>{" "}
              Credenciales de Acceso
            </h3>

            <div className="space-y-6 relative z-10">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Al habilitar el acceso, se generará una{" "}
                <strong>nueva contraseña automática</strong> y se enviará por
                correo electrónico al contacto.
              </p>

              <button
                onClick={handleSaveAccess}
                disabled={saving}
                className={`w-full justify-center text-white dark:text-white shadow-lg dark:shadow-black/30 py-3 rounded-xl font-bold mt-4 border-0 disabled:bg-zinc-400 disabled:text-zinc-100 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:hover:bg-zinc-400 dark:disabled:hover:bg-dark-700 ${saving ? "opacity-70 cursor-not-allowed" : ""} ${access ? "bg-red-600 hover:bg-red-700 shadow-red-200 dark:bg-red-700 dark:hover:bg-red-600 dark:shadow-black/30" : "bg-[#2277B4] hover:bg-[#125280] shadow-[#2277B450] dark:bg-blue-700 dark:hover:bg-blue-600 dark:shadow-black/30"}`}>
                {saving ?
                  "Procesando…"
                : access ?
                  "Revocar acceso al portal"
                : "Habilitar acceso al portal"}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 shadow-sm dark:shadow-black/20 relative overflow-hidden">
            <h3 className="font-semibold text-[#1a2b4c] dark:text-zinc-100 mb-2 flex items-center gap-2 text-sm">
              <span className="text-lg text-[#2277B4] dark:text-blue-300">
                <Tag size={20} />
              </span>{" "}
              Enviar Oferta Rápida a: {contact.full_name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Notificar al contacto sobre una promoción especial.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Descuento del 10% en renovación"
                className="flex-1 px-3 py-2 rounded-lg text-sm border border-zinc-300 dark:border-dark-700 bg-zinc-50 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/30 focus:border-[#2277B4] dark:focus:border-blue-400 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-800 dark:text-zinc-100"
              />
              <button className="px-4 py-2 rounded-lg bg-white dark:bg-dark-700 border border-zinc-300 dark:border-dark-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors shadow-sm dark:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/30">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
