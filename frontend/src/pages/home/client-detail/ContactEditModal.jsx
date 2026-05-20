import React from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";
import Input from "../../../components/ui/Input";

export default function ContactEditModal({
  isOpen,
  onClose,
  contactEditableColumns = [],
  contactForm = {},
  setContactForm,
  handleUpdateContact,
  getContactFieldInputType,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-700 flex items-center justify-between bg-[#1a2b4c]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Editar Contacto
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactEditableColumns.map((column) => (
              <div key={column.name} className="min-w-0">
                <Input
                  label={column.label}
                  type={getContactFieldInputType(column.name)}
                  value={contactForm[column.name] || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      [column.name]: e.target.value,
                    }))
                  }
                  required={column.name === "full_name"}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-dark-700 flex gap-2">
          <button
            className="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdateContact}
            className="flex-1 py-3 bg-[#2277B4] hover:bg-[#125280] text-white font-bold rounded-xl shadow-lg shadow-[#2277B450] transition-all duration-150 backdrop-blur-sm active:scale-95 active:translate-y-px"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
