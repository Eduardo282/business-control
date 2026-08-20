import React from "react";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, FolderOpen, X } from "@icons";

export function QuoteHistoryPagination({ table }) {
  return (
    <div className="p-4 flex items-center justify-between border-t border-light-border dark:border-zinc-700 bg-white dark:bg-dark-900">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Mostrar</span>
        <select
          aria-label="Registros por página"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-2 py-1 text-sm border rounded-lg bg-white dark:bg-dark-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30"
        >
          {[10, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">por página</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          ««
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
        <button
          type="button"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          »»
        </button>
      </div>
    </div>
  );
}

export function QuoteHistoryTable({
  activeFilterCount,
  clearFilters,
  filters = {},
  loading,
  onClearSingleFilter,
  onOpenFilterPicker,
  showFilters,
  tableState,
}) {
  const { table } = tableState;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2277B4] mr-3" />
        Cargando historial de cotizaciones…
      </div>
    );
  }

  return (
    <div className="glass-panel border border-light-border dark:border-dark-700 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-light-border dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-dark-900/50">
        <div className="flex flex-wrap items-center gap-2">
          {["client", "status", "folio"].map((field) => {
            const fieldLabels = { client: "Cliente", status: "Estado", folio: "Folio" };
            const selectedValue = filters[field] || "";
            return (
              <div
                key={field}
                className={`inline-flex items-center rounded-md border text-[11px] transition-all whitespace-nowrap ${
                  selectedValue
                    ? "border-[#2277B4] bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-200 dark:border-blue-500 shadow-sm"
                    : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-800"
                } ${
                  showFilters
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenFilterPicker(field)}
                  tabIndex={showFilters ? 0 : -1}
                  className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold hover:bg-zinc-50 dark:hover:bg-white/5 rounded-l-md transition-colors"
                >
                  <span className={selectedValue ? "text-[#2277B4] dark:text-blue-400 font-bold" : ""}>
                    {fieldLabels[field]}
                  </span>
                  {selectedValue && (
                    <span className="max-w-28 truncate font-medium text-zinc-700 dark:text-zinc-300">
                      {selectedValue}
                    </span>
                  )}
                </button>
                {selectedValue && showFilters && (
                  <button
                    type="button"
                    onClick={() => onClearSingleFilter?.(field)}
                    className="pr-2 pl-0.5 py-1 text-black hover:text-red-500 dark:text-zinc-100 dark:hover:text-red-400 transition-colors flex items-center justify-center focus:outline-none"
                    title={`Quitar filtro ${fieldLabels[field]}`}
                  >
                    <X size={12} className="text-black dark:text-zinc-100 hover:text-red-500" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={clearFilters}
            tabIndex={showFilters && activeFilterCount > 0 ? 0 : -1}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-100 dark:border-red-500/30 transition-all ${
              showFilters && activeFilterCount > 0 ?
                "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <X size={12} /> Limpiar filtros
          </button>
        </div>

        {table.getRowModel().rows.length > 0 && (
          <span className="text-xs text-light-text-secondary dark:text-zinc-400">
            Pág. {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(1, table.getPageCount())}
          </span>
        )}
      </div>

      <div className="max-h-[65vh] overflow-auto overscroll-contain">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-20 border-b border-light-border bg-white text-xs font-bold uppercase tracking-wider text-[#2277B4] shadow-[0_1px_0_rgba(228,228,231,1)] dark:border-zinc-700 dark:bg-dark-900 dark:text-blue-400 dark:shadow-[0_1px_0_rgba(63,63,70,1)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`bg-white p-4 dark:bg-dark-900 ${
                      (
                        header.column.id === "total" ||
                        header.column.id === "status"
                      ) ?
                        "text-right"
                      : (
                        header.column.id === "actions"
                      ) ?
                        "text-right"
                      : ""
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        header.column.id === "actions" ? "justify-end" : ""
                      }`}
                    >

                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-dark-800 rounded transition-colors"
                        >
                          {{
                            asc: <ChevronUp size={14} />,
                            desc: <ChevronDown size={14} />,
                          }[header.column.getIsSorted()] ?? (
                            <ChevronDown size={14} className="opacity-30" />
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-light-border dark:divide-zinc-700 bg-white dark:bg-dark-800">
            {table.getRowModel().rows.length > 0 ?
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50 dark:hover:bg-dark-700/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            : <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="p-12 text-center text-zinc-500 dark:text-zinc-400"
                >
                  <FolderOpen size={36} className="mx-auto mb-2 opacity-50" />
                  No se encontraron cotizaciones.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {table.getRowModel().rows.length > 0 && <QuoteHistoryPagination table={table} />}
    </div>
  );
}
