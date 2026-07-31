import React from "react";
import { createPortal } from "react-dom";
import { X, Search } from "@icons";
import { normalizeSearchText } from "../../../utils/formatters";

const FILTER_PAGE_SIZE = 50;

export default function ClientFilterPicker({
  isOpen,
  onClose,
  fieldName,
  fieldConfig,
  filters,
  options,
  filterPickerSearch,
  setFilterPickerSearch,
  filterPickerPage,
  setFilterPickerPage,
  onApplyFilter,
}) {
  if (!isOpen || !fieldName) return null;

  const closeFilterPicker = () => {
    setFilterPickerSearch("");
    setFilterPickerPage(0);
    onClose();
  };

  const applyFilterValue = (val) => {
    onApplyFilter(fieldName, val);
    closeFilterPicker();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/45 dark:bg-black/70 flex items-center justify-center p-4"
      onClick={closeFilterPicker}
    >
      <div
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-md overflow-hidden border border-transparent dark:border-dark-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-dark-700 bg-[#1a2b4c] dark:bg-blue-950 flex items-center justify-between">
          <div>
            <h3 className="text-white dark:text-white font-semibold text-base">
              Filtrar por {fieldConfig?.buttonLabel || "campo"}
            </h3>
            <p className="text-[11px] text-zinc-300 dark:text-zinc-300 mt-1">
              Selecciona o busca un valor
            </p>
          </div>
          <button
            onClick={closeFilterPicker}
            className="size-8 rounded-lg text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-lg px-3 py-2 focus-within:border-[#2277B4] dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-[#2277B4]/20 dark:focus-within:ring-blue-400/20 transition-colors">
            <Search size={15} className="text-zinc-500 dark:text-zinc-400" />
            <input
              value={filterPickerSearch}
              onChange={(e) => {
                setFilterPickerSearch(e.target.value);
                setFilterPickerPage(0);
              }}
              placeholder="Buscar valor…"
              className="w-full bg-transparent dark:bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 dark:border-dark-700 divide-y divide-zinc-100 dark:divide-dark-700 [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
            {options.length > 0 ? (
              options
                .slice(
                  filterPickerPage * FILTER_PAGE_SIZE,
                  (filterPickerPage + 1) * FILTER_PAGE_SIZE
                )
                .map((value) => {
                  const isSelected =
                    normalizeSearchText(filters[fieldName]) ===
                    normalizeSearchText(value);

                  return (
                    <button
                      key={`${fieldName}_${value}`}
                      onClick={() => applyFilterValue(value)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-[#2277B4]/10 text-[#125280] dark:bg-blue-500/10 dark:text-blue-300 font-semibold"
                          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-dark-700"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })
            ) : (
              <div className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                No hay valores para mostrar.
              </div>
            )}
          </div>

          <div className="min-h-9 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-dark-700">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {options.length > 0
                ? filterPickerPage * FILTER_PAGE_SIZE + 1
                : 0}{" "}
              -{" "}
              {Math.min(
                (filterPickerPage + 1) * FILTER_PAGE_SIZE,
                options.length
              )}{" "}
              de {options.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  setFilterPickerPage((p) => Math.max(0, p - 1))
                }
                disabled={filterPickerPage === 0}
                className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-dark-700 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-dark-800 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilterPickerPage((p) => p + 1)}
                disabled={
                  (filterPickerPage + 1) * FILTER_PAGE_SIZE >= options.length
                }
                className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-dark-700 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400 dark:disabled:bg-dark-800 dark:disabled:text-zinc-600 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-dark-800 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
