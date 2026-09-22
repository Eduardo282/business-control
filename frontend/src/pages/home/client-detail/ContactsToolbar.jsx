import {
  FileSpreadsheet,
  FileText,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "@icons";

export default function ContactsToolbar({
  client,
  user,
  filteredContactCount,
  openBulkContactModal,
  contactSearch,
  setContactSearch,
  handleExportContactsPDF,
  handleExportContactsExcel,
  showContactFilters,
  setShowContactFilters,
  activeContactFilterCount,
  clearContactFilters,
  contactsTable,
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
            Contactos registrados de: {client.business_name}
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-zinc-400">
            <span className="font-bold text-[#52525b] dark:text-zinc-300">
              Total Contactos ({filteredContactCount})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role?.name === "ADMIN" ||
            user?.role?.name === "VENTAS") && (
            <button
              onClick={openBulkContactModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#1a2b4c] dark:text-zinc-100 bg-white/60 dark:bg-dark-900/60 border border-white/30 dark:border-white/10 hover:bg-white/90 dark:hover:bg-dark-700 transition-all backdrop-blur-md shadow-glass-sm focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
            >
              <Upload size={15} />
              Cargar contactos
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 bg-white/60 dark:bg-dark-900/60 p-1 rounded-xl border border-white/25 dark:border-white/15 flex-1 min-w-[200px] backdrop-blur-md shadow-glass-sm focus-within:border-[#2277B4] dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-[#2277B4]/20 dark:focus-within:ring-blue-400/20 transition-all">
          <input
            value={contactSearch}
            onChange={(event) => setContactSearch(event.target.value)}
            placeholder="Buscar contacto…"
            className="bg-transparent dark:bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 px-3 w-full focus:outline-none"
          />
          {contactSearch && (
            <button
              onClick={() => setContactSearch("")}
              className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
          <div className="px-3 py-1.5 text-black dark:text-zinc-400 flex items-center justify-center">
            <Search size={16} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportContactsPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-red-200/80 dark:border-red-500/30 bg-white/70 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-white/95 dark:hover:bg-red-500/20 transition-all backdrop-blur-md shadow-glass-sm whitespace-nowrap"
              title="Exportar a PDF"
            >
              <FileText size={14} /> Exportar a PDF
            </button>

            <button
              onClick={handleExportContactsExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-emerald-200/80 dark:border-emerald-500/30 bg-white/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-white/95 dark:hover:bg-emerald-500/20 transition-all backdrop-blur-md shadow-glass-sm whitespace-nowrap"
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={14} /> Exportar a Excel
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowContactFilters((value) => !value)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all backdrop-blur-md shadow-glass-sm ${
            showContactFilters || activeContactFilterCount > 0
              ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-700 dark:text-white dark:border-blue-600"
              : "bg-white/70 dark:bg-dark-900/60 text-zinc-700 dark:text-zinc-300 border-white/25 dark:border-white/15 hover:bg-white/95 dark:hover:bg-dark-800"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeContactFilterCount > 0 && (
            <span className="ml-1 bg-white text-[#2277B4] dark:bg-blue-200 dark:text-blue-950 rounded-full text-xs font-bold size-5 flex items-center justify-center">
              {activeContactFilterCount}
            </span>
          )}
        </button>

        {activeContactFilterCount > 0 && (
          <button
            onClick={clearContactFilters}
            className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
          >
            <X size={14} /> Limpiar
          </button>
        )}

        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
          Pág. {contactsTable.getState().pagination.pageIndex + 1} de{" "}
          {contactsTable.getPageCount() || 1}
        </span>
      </div>
    </>
  );
}
