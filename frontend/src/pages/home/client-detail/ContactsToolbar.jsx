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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1a2b4c] dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
            >
              <Upload size={15} />
              Cargar contactos
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 bg-white dark:bg-dark-900 p-1 rounded-lg border border-zinc-200 dark:border-dark-700 flex-1 min-w-[200px] focus-within:border-[#2277B4] dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-[#2277B4]/20 dark:focus-within:ring-blue-400/20 transition-colors">
          <input
            value={contactSearch}
            onChange={(event) => setContactSearch(event.target.value)}
            placeholder="Buscar contacto…"
            className="bg-transparent dark:bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 px-3 w-full focus:outline-none"
          />
          <div className="px-3 py-1.5 text-black dark:text-zinc-400">
            <Search size={16} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportContactsPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors whitespace-nowrap"
              title="Exportar a PDF"
            >
              <FileText size={14} /> Exportar a PDF
            </button>

            <button
              onClick={handleExportContactsExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={14} /> Exportar a Excel
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowContactFilters((value) => !value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            showContactFilters || activeContactFilterCount > 0
              ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-700 dark:text-white dark:border-blue-600"
              : "bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-50 dark:hover:bg-dark-800"
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
