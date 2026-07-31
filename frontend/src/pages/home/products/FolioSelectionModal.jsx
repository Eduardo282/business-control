import React from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";

export function FolioSelectionModal({ group, onClose, onSelect }) {
  if (!group) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 dark:bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="folio-selection-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800 dark:shadow-black/50 border border-transparent dark:border-dark-700"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 bg-[#1a2b4c] px-5 py-4 dark:border-dark-700 dark:bg-blue-950">
          <div className="min-w-0">
            <h3
              id="folio-selection-title"
              className="truncate text-base font-semibold text-white"
            >
              Folios de {group.name}
            </h3>
            <p className="mt-1 text-[11px] text-zinc-300">
              Selecciona el producto que deseas mostrar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de folios"
            className="flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-80 divide-y divide-zinc-100 overflow-y-auto p-3 dark:divide-dark-700 [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
          {group.items.map((product) => {
            const isSelected = String(product.id) === String(group.selectedId);

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(group.key, product)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? "bg-[#2277B4]/10 text-[#125280] dark:bg-blue-500/10 dark:text-blue-300"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-dark-700"
                }`}
              >
                <span className="font-mono text-sm font-bold tracking-wider">
                  {product.folio || "Sin folio"}
                </span>
                {isSelected && (
                  <span className="text-[11px] font-semibold uppercase">
                    Actual
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
