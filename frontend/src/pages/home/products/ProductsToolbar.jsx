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
            className="w-full pl-4 pr-9 py-2 rounded-xl border border-white/80 dark:border-white/15 bg-white/70 dark:bg-dark-900/70 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 text-sm backdrop-blur-md shadow-glass-sm transition-all"
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
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold border border-red-200/80 dark:border-red-900/50 bg-white/70 dark:bg-dark-900/60 text-red-600 dark:text-red-400 hover:bg-white/95 dark:hover:bg-red-900/20 backdrop-blur-md shadow-glass-sm transition-all whitespace-nowrap"
          title="Exportar a PDF"
        >
          <FileText size={14} />
          Exportar a PDF
        </button>

        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold border border-emerald-200/80 dark:border-emerald-900/50 bg-white/70 dark:bg-dark-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-white/95 dark:hover:bg-emerald-900/20 backdrop-blur-md shadow-glass-sm transition-all whitespace-nowrap"
          title="Exportar a Excel"
        >
          <FileSpreadsheet size={14} />
          Exportar a Excel
        </button>

        <button
          type="button"
          onClick={onToggleFilters}
          className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md shadow-glass-sm ${
            showFilters || activeFilterCount > 0
              ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-700 dark:text-white dark:border-blue-600"
              : "bg-white/70 dark:bg-dark-900/60 text-zinc-700 dark:text-zinc-300 border-white/80 dark:border-white/15 hover:bg-white/90 dark:hover:bg-dark-800"
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
  );
}
