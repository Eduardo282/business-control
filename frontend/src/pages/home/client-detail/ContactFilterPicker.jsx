import React from "react";
import { createPortal } from "react-dom";
import { X, Search } from "@icons";

const FILTER_PAGE_SIZE = 10;

export default function ContactFilterPicker({
  isOpen,
  onClose,
  activeContactFilterPickerField,
  activeContactFilterPickerConfig,
  contactFilterPickerSearch,
  setContactFilterPickerSearch,
  contactFilterPickerPage,
  setContactFilterPickerPage,
  visibleContactFilterPickerOptions = [],
  contactFilters = {},
  applyContactFilterValue,
  normalizeSearchText,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-dark-700 bg-[#1a2b4c] flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base">
              Filtrar por{" "}
              {(
                activeContactFilterPickerConfig?.buttonLabel || "campo"
              ).toLowerCase()}
            </h3>
            <p className="text-[11px] text-zinc-300 mt-1">
              Selecciona o busca un valor
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-lg px-3 py-2">
            <Search size={15} className="text-zinc-500" />
            <input
              value={contactFilterPickerSearch}
              onChange={(e) => {
                setContactFilterPickerSearch(e.target.value);
                setContactFilterPickerPage(0);
              }}
              placeholder="Buscar valor…"
              className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 dark:border-dark-700 divide-y divide-zinc-100 dark:divide-dark-700">
            {visibleContactFilterPickerOptions.length > 0 ? (
              visibleContactFilterPickerOptions
                .slice(
                  contactFilterPickerPage * FILTER_PAGE_SIZE,
                  (contactFilterPickerPage + 1) * FILTER_PAGE_SIZE,
                )
                .map((value) => {
                  const isSelected =
                    normalizeSearchText(
                      contactFilters[activeContactFilterPickerField],
                    ) === normalizeSearchText(value);

                  return (
                    <button
                      key={`${activeContactFilterPickerField}_${value}`}
                      onClick={() => applyContactFilterValue(value)}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-[#2277B4]/10 text-[#125280] dark:text-blue-400 font-semibold"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-dark-700"
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
              {visibleContactFilterPickerOptions.length > 0
                ? contactFilterPickerPage * FILTER_PAGE_SIZE + 1
                : 0}{" "}
              -{" "}
              {Math.min(
                (contactFilterPickerPage + 1) * FILTER_PAGE_SIZE,
                visibleContactFilterPickerOptions.length,
              )}{" "}
              de {visibleContactFilterPickerOptions.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  setContactFilterPickerPage((page) =>
                    Math.max(0, page - 1),
                  )
                }
                disabled={contactFilterPickerPage === 0}
                className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-dark-700 rounded hover:bg-zinc-200 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() =>
                  setContactFilterPickerPage((page) => page + 1)
                }
                disabled={
                  (contactFilterPickerPage + 1) * FILTER_PAGE_SIZE >=
                  visibleContactFilterPickerOptions.length
                }
                className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-dark-700 rounded hover:bg-zinc-200 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
