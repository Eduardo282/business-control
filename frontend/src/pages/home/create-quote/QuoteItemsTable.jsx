import { createPortal } from "react-dom";
import { flexRender } from "@tanstack/react-table";
import {
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
} from "@icons";
import { normalizeSearchText } from "../../../utils/formatters";
import {
  TABLE_FILTER_BUTTONS,
  TABLE_FILTER_FIELD_LABELS,
} from "./quoteTableConfig";

export default function QuoteItemsTable({
  selectedClient,
  items,
  itemsTable,
  showTableFilters,
  setShowTableFilters,
  tableFilters,
  activeTableFilterPickerField,
  tableFilterPickerSearch,
  setTableFilterPickerSearch,
  activeTableFilterCount,
  openTableFilterPicker,
  closeTableFilterPicker,
  applyTableFilterValue,
  clearTableFilters,
  visibleTableFilterPickerOptions,
}) {
  return (
    <>
      {activeTableFilterPickerField &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
            onClick={closeTableFilterPicker}
          >
            <div
              className="bg-white dark:bg-dark-900 rounded-2xl border border-zinc-200 dark:border-dark-700 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/10 bg-[#1a2b4c] flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base uppercase">
                    Filtrar por{" "}
                    {TABLE_FILTER_FIELD_LABELS[activeTableFilterPickerField]}
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Selecciona o busca un valor
                  </p>
                </div>
                <button
                  onClick={closeTableFilterPicker}
                  className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3 bg-white dark:bg-dark-900">
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 rounded-lg px-3 py-2 focus-within:border-[#2277B4] dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-[#2277B4]/20 dark:focus-within:ring-blue-500/20">
                  <Search
                    size={15}
                    className="text-zinc-500 dark:text-zinc-400"
                  />
                  <input
                    value={tableFilterPickerSearch}
                    onChange={(event) =>
                      setTableFilterPickerSearch(event.target.value)
                    }
                    placeholder="Buscar valor…"
                    className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-900 divide-y divide-zinc-100 dark:divide-dark-700">
                  {visibleTableFilterPickerOptions.length > 0 ?
                    visibleTableFilterPickerOptions.map((value) => {
                      const isSelected =
                        normalizeSearchText(
                          tableFilters[activeTableFilterPickerField],
                        ) === normalizeSearchText(value);

                      return (
                        <button
                          key={`${activeTableFilterPickerField}_${value}`}
                          onClick={() => applyTableFilterValue(value)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            isSelected ?
                              "bg-[#2277B4]/10 text-[#125280] font-semibold dark:bg-blue-500/10 dark:text-blue-300"
                            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })
                  : <div className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                      No hay valores para mostrar.
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div
        className={`glass-panel overflow-hidden rounded-xl border border-light-border dark:border-white/10 ${!selectedClient || items.length === 0 ? "opacity-40 pointer-events-none select-none grayscale relative" : "transition-all duration-500"}`}
      >
        {(!selectedClient || items.length === 0) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[2px]">
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg mb-3">
              <BadgeDollarSign size={32} className="text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-200 font-semibold max-w-sm text-center px-4">
              Agrega &quot;Datos del Cliente y Agrega Productos&quot; para
              habilitar.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() =>
                  setShowTableFilters((previous) => {
                    const next = !previous;
                    if (!next) closeTableFilterPicker();
                    return next;
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                  showTableFilters || activeTableFilterCount > 0 ?
                    "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-600 dark:border-blue-500"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-dark-900 dark:text-zinc-300 dark:border-dark-700 dark:hover:bg-dark-800"
                }`}
              >
                <SlidersHorizontal size={12} /> Filtros
                {activeTableFilterCount > 0 && (
                  <span className="ml-0.5 bg-white text-[#125280] ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-300/40 text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
                    {activeTableFilterCount}
                  </span>
                )}
              </button>

              {showTableFilters &&
                TABLE_FILTER_BUTTONS.map((button) => {
                  const selectedValue = String(
                    tableFilters[button.id] || "",
                  );

                  return (
                    <button
                      key={button.id}
                      onClick={() => openTableFilterPicker(button.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap ${
                        selectedValue ?
                          "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-600 dark:border-blue-500"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-dark-900 dark:text-zinc-300 dark:border-dark-700 dark:hover:bg-dark-800"
                      }`}
                    >
                      <span className="uppercase font-bold tracking-wide">
                        {button.label}
                      </span>
                    </button>
                  );
                })}

              {showTableFilters && activeTableFilterCount > 0 && (
                <button
                  onClick={clearTableFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-100 dark:border-red-500/30 transition-colors"
                >
                  <X size={12} /> Limpiar
                </button>
              )}
            </div>

            <span className="text-xs text-light-text-secondary dark:text-zinc-400">
              Pág. {itemsTable.getState().pagination.pageIndex + 1} de{" "}
              {Math.max(1, itemsTable.getPageCount())}
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-bg/50 dark:bg-dark-800 uppercase text-xs font-bold text-[#2277B4] dark:text-blue-400 tracking-wider">
              {itemsTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`p-3 whitespace-nowrap select-none ${
                        header.id === "totalIva" ?
                          "text-right text-[#1B4733] dark:text-emerald-400"
                        : header.id === "quantity" ? "text-center"
                        : ["price", "discount", "total"].includes(header.id) ?
                          "text-right"
                        : header.id === "actions" ? "w-28 text-right"
                        : ""
                      } ${
                        header.column.getCanSort() ?
                          "cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUp size={11} />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown size={11} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-700">
              {itemsTable.getRowModel().rows.length > 0 ?
                itemsTable.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-light-bg/50 dark:hover:bg-white/5 transition-colors group animate-fade-in"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`p-3 ${
                          cell.column.id === "totalIva" ? "text-right"
                          : cell.column.id === "quantity" ? "text-center"
                          : ["price", "discount", "total"].includes(
                                cell.column.id,
                              ) ?
                            "text-right"
                          : cell.column.id === "actions" ? "text-right"
                          : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              : <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <p className="text-light-text-secondary dark:text-zinc-400 text-sm font-medium">
                      {items.length === 0 ?
                        ""
                      : "Sin resultados para el filtro aplicado."}
                    </p>
                    {items.length === 0 && ""}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-light-border dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between gap-3 flex-wrap">
            <label className="text-sm text-light-text-secondary dark:text-zinc-400 flex items-center gap-2">
              Mostrar
              <select
                value={itemsTable.getState().pagination.pageSize}
                onChange={(event) => {
                  itemsTable.setPageSize(Number(event.target.value));
                  itemsTable.setPageIndex(0);
                }}
                className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-[#fff] dark:bg-dark-900 border border-light-border dark:border-dark-700"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option
                    key={size}
                    value={size}
                    className="dark:bg-dark-900 dark:text-zinc-100"
                  >
                    {size}
                  </option>
                ))}
              </select>
              por página
            </label>

            <div className="flex items-center gap-1">
              <button
                onClick={() => itemsTable.setPageIndex(0)}
                disabled={!itemsTable.getCanPreviousPage()}
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ««
              </button>
              <button
                onClick={() => itemsTable.previousPage()}
                disabled={!itemsTable.getCanPreviousPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mx-2">
                Pág. {itemsTable.getState().pagination.pageIndex + 1} de{" "}
                {itemsTable.getPageCount()}
              </span>
              <button
                onClick={() => itemsTable.nextPage()}
                disabled={!itemsTable.getCanNextPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
              <button
                onClick={() =>
                  itemsTable.setPageIndex(itemsTable.getPageCount() - 1)
                }
                disabled={!itemsTable.getCanNextPage()}
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
