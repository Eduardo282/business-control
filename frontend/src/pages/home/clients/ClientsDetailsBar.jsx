import { ChevronRight, FileSpreadsheet, Lightbulb } from "@icons";

export default function ClientsDetailsBar({
  detailColumnCount,
  filters,
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
              <button
                key={button.id}
                onClick={() => onOpenFilterPicker(button.fieldName)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs border transition-colors whitespace-nowrap ${
                  selectedValue
                    ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-700 dark:text-white dark:border-blue-600"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-dark-800 dark:text-zinc-300 dark:border-dark-700 dark:hover:bg-dark-700"
                }`}
              >
                <span className="uppercase font-bold tracking-wide">
                  {button.buttonLabel}
                </span>
              </button>
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
