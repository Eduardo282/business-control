import React from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";
import Input from "../../../components/ui/Input";

export default function ClientEditModal({
  isOpen,
  onClose,
  clientBusinessName,
  clientGeneralFields = [],
  clientForm = {},
  setClientForm,
  handleUpdateClient,
  isClientFieldFullWidth,
  getClientFieldInputType,
  isClientFieldReadOnly,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-700 flex items-center justify-between bg-[#1a2b4c]">
          <div className="flex justify-center items-center gap-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Editar cliente
            </h2>
            <span className="text-sm text-zinc-300">
              {clientBusinessName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={handleUpdateClient}
          className="px-6 py-4 space-y-4 overflow-y-auto max-h-[70vh]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientGeneralFields.map((field) => (
              <div
                key={field.name}
                className={
                  isClientFieldFullWidth(field.name) ? "md:col-span-2" : ""
                }
              >
                <Input
                  label={field.label}
                  type={getClientFieldInputType(field.name)}
                  disabled={isClientFieldReadOnly(field.name)}
                  value={clientForm[field.name] || ""}
                  onChange={(e) =>
                    setClientForm((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#2277B4] hover:bg-[#125280] text-white font-bold rounded-xl shadow-lg shadow-[#2277B450] transition-all duration-150 active:scale-95 active:translate-y-px"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
