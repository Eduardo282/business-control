import React from "react";
import { createPortal } from "react-dom";
import { X, Package, Shield, ShoppingBag, Library, ChevronDown } from "@icons";

export default function SourceSelectionModal({
  isOpen,
  onClose,
  selectedCategory,
  onSelectSource,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl dark:shadow-black/50 animate-fade-in relative border border-transparent dark:border-dark-700">
        <div className="p-4 rounded-t-2xl border-b border-[#24395f] dark:border-dark-700 bg-[#1a2b4c] dark:bg-blue-950 flex items-center justify-between">
          <h2 className="font-semibold text-white dark:text-white text-lg">
            Productos y Servicios
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-lg px-3 py-2">
            Categoría activa:{" "}
            <strong className="text-zinc-700 dark:text-zinc-200">
              {selectedCategory || "-- ninguna --"}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => onSelectSource("CONTPAQI")}
            className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 dark:border-dark-700 bg-blue-50/50 dark:bg-dark-700 hover:bg-blue-100/70 dark:hover:bg-blue-500/10 text-[#125280] dark:text-blue-300 font-semibold transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <Package size={18} />
              </div>
              Productos de CONTPAQI
            </div>
            <ChevronDown
              size={16}
              className="-rotate-90 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-300"
            />
          </button>

          <button
            type="button"
            onClick={() => onSelectSource("POLICY")}
            className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 dark:border-dark-700 bg-blue-50/50 dark:bg-dark-700 hover:bg-blue-100/70 dark:hover:bg-blue-500/10 text-[#125280] dark:text-blue-300 font-semibold transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-300">
                <Shield size={18} />
              </div>
              Pólizas
            </div>
            <ChevronDown
              size={16}
              className="-rotate-90 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-300"
            />
          </button>

          <button
            type="button"
            onClick={() => onSelectSource("PRODUCT")}
            className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 dark:border-dark-700 bg-blue-50/50 dark:bg-dark-700 hover:bg-blue-100/70 dark:hover:bg-blue-500/10 text-[#125280] dark:text-blue-300 font-semibold transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <ShoppingBag size={18} />
              </div>
              Productos
            </div>
            <ChevronDown
              size={16}
              className="-rotate-90 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-300"
            />
          </button>

          <button
            type="button"
            onClick={() => onSelectSource("SERVICE")}
            className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 dark:border-dark-700 bg-blue-50/50 dark:bg-dark-700 hover:bg-blue-100/70 dark:hover:bg-blue-500/10 text-[#125280] dark:text-blue-300 font-semibold transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center text-blue-800 dark:text-blue-300">
                <Library size={18} />
              </div>
              Servicios
            </div>
            <ChevronDown
              size={16}
              className="-rotate-90 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-300"
            />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
