import {
  FileSpreadsheet,
  FileText,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "@icons";

export default function ClientsToolbar({
  activeFilterCount,
  canManageClients,
  clientCount,
  onClearFilters,
  onExportExcel,
  onExportPdf,
  onOpenBulk,
  onQueryChange,
  onToggleFilters,
  pageCount,
  pageIndex,
  query,
  showFilters,
}) {
  return (
    <div className="px-4 py-3 border-b border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Total clientes ({clientCount})
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <div className="flex gap-1 bg-white dark:bg-dark-900 p-1 rounded-lg border border-zinc-200 dark:border-dark-700 focus-within:border-[#2277B4] dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-[#2277B4]/20 dark:focus-within:ring-blue-400/20 transition-colors">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar cliente…"
            title="Busca por todos los campos. Ignora acentos, mayusculas y caracteres especiales."
            className="bg-transparent dark:bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 px-3 w-40 md:w-52 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
          <div className="px-3 py-1.5 text-black dark:text-zinc-300 flex items-center justify-center">
            <Search size={16} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-900/60 bg-white dark:bg-dark-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
            title="Exportar a PDF"
          >
            <FileText size={14} /> Exportar a PDF
          </button>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-dark-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/40"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={14} /> Exportar a Excel
          </button>
        </div>

        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            showFilters || activeFilterCount > 0
              ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-700 dark:text-white dark:border-blue-600"
              : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-dark-900 dark:text-zinc-300 dark:border-dark-700 dark:hover:bg-dark-700"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-[#2277B4] dark:bg-blue-200 dark:text-blue-950 rounded-full text-xs font-bold size-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {canManageClients && (
          <button
            onClick={onOpenBulk}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1a2b4c] dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
          >
            <Upload size={15} />
            Cargar clientes
          </button>
        )}

        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
          >
            <X size={14} /> Limpiar
          </button>
        )}

        <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden md:inline">
          Pág. {pageIndex + 1} de {pageCount || 1}
        </span>
      </div>
    </div>
  );
}
