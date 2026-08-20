import { ChevronRight, FileSpreadsheet, Lightbulb, X } from "@icons";

export default function ClientsDetailsBar({
  detailColumnCount,
  filters,
  onClearSingleFilter,
  onDownloadTemplate,
  onOpenFilterPicker,
  quickFilterButtons,
  showFilters,
}) {
  return (
    <div className="px-4 py-2 min-h-10 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20 text-xs text-[#2277B4] dark:text-blue-300 flex items-center justify-between gap-3">
      {detailColumnCount > 0 ? (
        <div className="flex items-center gap-1 shrink-0">
          <Lightbulb size={14} className="inline" /> Clic en{" "}
          <ChevronRight size={12} className="inline" /> para más detalles
        </div>
      ) : (
        <div className="shrink-0" />
      )}

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 transition-opacity duration-150 ${
            showFilters ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {quickFilterButtons.map((button) => {
            const selectedValue = String(filters[button.fieldName] || "");

            return (
              <div
                key={button.id}
                className={`inline-flex items-center rounded-md border text-xs transition-colors ${
                  selectedValue
                    ? "border-[#2277B4] bg-white dark:bg-dark-800 text-zinc-800 dark:text-zinc-200 dark:border-blue-500 shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-dark-700 dark:bg-dark-800 dark:text-zinc-300 dark:hover:bg-dark-700"
                }`}
              >
                <button
                  onClick={() => onOpenFilterPicker(button.fieldName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-white/5 rounded-l-md transition-colors whitespace-nowrap"
                >
                  <span className={`uppercase font-bold tracking-wide ${selectedValue ? "text-[#2277B4] dark:text-blue-400" : ""}`}>
                    {button.buttonLabel}
                  </span>
                  {selectedValue && (
                    <span className="max-w-28 truncate font-medium text-zinc-700 dark:text-zinc-300">
                      {selectedValue}
                    </span>
                  )}
                </button>
                {selectedValue && (
                  <button
                    type="button"
                    onClick={() => onClearSingleFilter(button.fieldName)}
                    className="pr-2 pl-0.5 py-1 text-black hover:text-red-500 dark:text-zinc-100 dark:hover:text-red-400 transition-colors flex items-center justify-center focus:outline-none"
                    title={`Quitar filtro ${button.buttonLabel}`}
                  >
                    <X size={12} className="text-black dark:text-zinc-100 hover:text-red-500" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/40"
          title="Descargar plantilla de carga masiva"
        >
          <FileSpreadsheet size={13} /> Descargar plantilla excel
        </button>
      </div>
    </div>
  );
}
