import React from "react";
import { FileSpreadsheet, FileText, Search, SlidersHorizontal, X } from "@icons";

export function ProductsToolbar({
  activeFilterCount,
  categoryFilter,
  onExportExcel,
  onExportPdf,
  onQueryChange,
  onToggleFilters,
  query,
  showFilters,
}) {
  return (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-md border border-zinc-200 dark:border-dark-700 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
            {categoryFilter ? categoryFilter + "s" : "Catálogo de Productos o servicios"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {categoryFilter
              ? `Administra el inventario de ${categoryFilter}s disponibles.`
              : "Productos para clientes."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            {!query && (
              <Search
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
            )}
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por folio, nombre, categoría…"
              className="w-full pl-4 pr-9 py-2 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 text-sm transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/40 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold border border-red-200 dark:border-red-900/50 bg-white dark:bg-dark-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
            title="Exportar a PDF"
          >
            <FileText size={14} />
            Exportar a PDF
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors whitespace-nowrap"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={14} />
            Exportar a Excel
          </button>

          <button
            type="button"
            onClick={onToggleFilters}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-700 dark:text-white dark:border-blue-600"
                : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-dark-700 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-white text-[#1a2b4c] dark:bg-blue-200 dark:text-blue-950 text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
