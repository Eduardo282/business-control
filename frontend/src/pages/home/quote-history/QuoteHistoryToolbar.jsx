import React from "react";
import { BadgeDollarSign, FileSpreadsheet, FileText, Search, SlidersHorizontal } from "@icons";

export function QuoteHistoryToolbar({
  activeFilterCount,
  onExportExcel,
  onExportPdf,
  onQueryChange,
  onToggleFilters,
  query,
  showFilters,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <BadgeDollarSign size={28} className="text-light-text-primary dark:text-zinc-100" />
        <div>
          <h1 className="text-3xl font-semibold text-light-text-primary dark:text-zinc-100">
            Historial de Cotizaciones
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-zinc-400">
            Consulta rápida de las cotizaciones generadas.
          </p>
        </div>
      </div>

      <div className="w-full sm:w-auto flex items-center gap-2">
        <div className="relative flex-1 sm:flex-none">
          <Search
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por cliente, contacto…"
            className="w-full sm:w-80 pl-4 pr-11 py-3 bg-white dark:bg-dark-900 border border-zinc-300 dark:border-dark-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-500/30 focus:border-[#2277B4] dark:focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-dark-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors whitespace-nowrap shadow-sm"
          title="Exportar a PDF"
        >
          <FileText size={16} /> Exportar PDF
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-dark-900 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors whitespace-nowrap shadow-sm"
          title="Exportar a Excel"
        >
          <FileSpreadsheet size={16} /> Exportar Excel
        </button>

        <button
          type="button"
          onClick={onToggleFilters}
          className={`inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
            showFilters || activeFilterCount > 0 ?
              "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-600 dark:border-blue-500"
            : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-800"
          }`}
        >
          <SlidersHorizontal size={14} /> Filtros
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-white text-[#125280] ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-300/40 text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
