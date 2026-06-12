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
      className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
      onClick={closeFilterPicker}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base">
              Filtrar por {fieldConfig?.buttonLabel || "campo"}
            </h3>
            <p className="text-[11px] text-zinc-300 mt-1">
              Selecciona o busca un valor
            </p>
          </div>
          <button
            onClick={closeFilterPicker}
            className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={15} className="text-zinc-500" />
            <input
              value={filterPickerSearch}
              onChange={(e) => {
                setFilterPickerSearch(e.target.value);
                setFilterPickerPage(0);
              }}
              placeholder="Buscar valor…"
              className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
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
                          ? "bg-[#2277B4]/10 text-[#125280] font-semibold"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })
            ) : (
              <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                No hay valores para mostrar.
              </div>
            )}
          </div>

          <div className="min-h-9 flex items-center justify-between pt-2 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">
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
                className="px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilterPickerPage((p) => p + 1)}
                disabled={
                  (filterPickerPage + 1) * FILTER_PAGE_SIZE >= options.length
                }
                className="px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
