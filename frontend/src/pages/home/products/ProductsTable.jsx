import React from "react";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, PackageX, X } from "@icons";
import { ProductsPagination } from "./ProductsPagination";

export function ProductsTable({
  activeFilterCount,
  clearFilters,
  filteredProductsCount,
  filterPriceMax,
  filterPriceMin,
  filterType,
  filterUsers,
  isTableScrollable,
  loading,
  onClearSingleFilter,
  onOpenFilterPicker,
  productFilters,
  quickFilterButtons,
  setFilterPriceMax,
  setFilterPriceMin,
  setFilterType,
  setFilterUsers,
  showFilters,
  tableState,
}) {
  const { pagination, setPagination, table } = tableState;

  if (loading) {
    return (
      <div className="glass-panel glass-mirror p-16 text-center rounded-2xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass-sm">
        <div className="animate-spin size-10 border-4 border-blue-500 dark:border-blue-400 border-t-transparent dark:border-t-transparent rounded-full mx-auto mb-4 scale-110" />
        <p className="text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
          Analizando catálogo de productos...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-mirror rounded-2xl border border-white/25 dark:border-white/10 bg-white/35 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass-sm dark:shadow-glass-mirror overflow-hidden">
      {/* Toolbar de tabla / Filtros */}
      <div className="px-5 py-3.5 border-b border-white/15 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-end gap-3 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md">
        <div
          className={`flex flex-1 flex-wrap items-center gap-2 transition-opacity duration-150 ${
            showFilters
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          {quickFilterButtons.map((button) => {
            const selectedValue = productFilters[button.id];
            return (
              <div
                key={button.id}
                className={`inline-flex items-center rounded-xl border text-xs transition-colors backdrop-blur-md shadow-glass-sm ${
                  selectedValue
                    ? "border-[#2277B4] bg-white/90 dark:bg-dark-800 text-zinc-800 dark:text-zinc-200 dark:border-blue-500"
                    : "border-white/80 bg-white/70 text-zinc-700 hover:bg-white/95 dark:border-white/15 dark:bg-dark-800 dark:text-zinc-300 dark:hover:bg-dark-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenFilterPicker(button.id)}
                  tabIndex={showFilters ? 0 : -1}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-l-xl transition-colors"
                >
                  <span className={selectedValue ? "text-[#2277B4] dark:text-blue-400 font-bold" : ""}>
                    {button.buttonLabel}
                  </span>
                  {selectedValue && (
                    <span className="max-w-28 truncate font-medium text-zinc-700 dark:text-zinc-300 lowercase">
                      {selectedValue}
                    </span>
                  )}
                </button>
                {selectedValue && (
                  <button
                    type="button"
                    onClick={() => onClearSingleFilter?.(button.id)}
                    className="pr-2 pl-0.5 py-1 text-black hover:text-red-500 dark:text-zinc-100 dark:hover:text-red-400 transition-colors flex items-center justify-center focus:outline-none"
                    title={`Quitar filtro ${button.buttonLabel}`}
                  >
                    <X size={12} className="text-black dark:text-zinc-100 hover:text-red-500" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}
          <select
            aria-label="Filtrar por tipo"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            tabIndex={showFilters ? 0 : -1}
            className={`h-7 min-w-28 rounded-xl border px-2.5 text-xs font-semibold outline-none transition-colors backdrop-blur-md shadow-glass-sm dark:[color-scheme:dark] focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 ${
              filterType
                ? "border-[#2277B4] bg-white/90 text-zinc-800 dark:border-blue-400 dark:bg-dark-800 dark:text-zinc-200"
                : "border-white/80 bg-white/70 text-zinc-700 focus:border-[#2277B4] dark:border-white/15 dark:bg-dark-800 dark:text-zinc-300 dark:focus:border-blue-400"
            }`}
          >
            <option value="">Tipo</option>
            <option value="PRODUCT">Productos</option>
            <option value="CONTPAQI">CONTPAQi</option>
            <option value="SERVICE">Servicios</option>
          </select>
          <input
            type="number"
            min="0"
            aria-label="Precio mínimo"
            value={filterPriceMin}
            onChange={(event) => setFilterPriceMin(event.target.value)}
            placeholder="Precio mín."
            tabIndex={showFilters ? 0 : -1}
            className={`h-7 w-24 rounded-xl border px-2 text-xs outline-none transition-colors backdrop-blur-md shadow-glass-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#2277B4] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 dark:[color-scheme:dark] ${
              filterPriceMin !== ""
                ? "border-[#2277B4] bg-[#2277B4]/10 text-[#125280] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-white/80 bg-white/70 text-zinc-700 dark:border-white/15 dark:bg-dark-800 dark:text-zinc-300"
            }`}
          />
          <input
            type="number"
            min="0"
            aria-label="Precio máximo"
            value={filterPriceMax}
            onChange={(event) => setFilterPriceMax(event.target.value)}
            placeholder="Precio máx."
            tabIndex={showFilters ? 0 : -1}
            className={`h-7 w-24 rounded-xl border px-2 text-xs outline-none transition-colors backdrop-blur-md shadow-glass-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#2277B4] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 dark:[color-scheme:dark] ${
              filterPriceMax !== ""
                ? "border-[#2277B4] bg-[#2277B4]/10 text-[#125280] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-white/80 bg-white/70 text-zinc-700 dark:border-white/15 dark:bg-dark-800 dark:text-zinc-300"
            }`}
          />
          <input
            type="number"
            min="0"
            aria-label="Usuarios mínimos"
            value={filterUsers}
            onChange={(event) => setFilterUsers(event.target.value)}
            placeholder="Usuarios"
            tabIndex={showFilters ? 0 : -1}
            className={`h-7 w-24 rounded-xl border px-2 text-xs outline-none transition-colors backdrop-blur-md shadow-glass-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#2277B4] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 dark:[color-scheme:dark] ${
              filterUsers !== ""
                ? "border-[#2277B4] bg-[#2277B4]/10 text-[#125280] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-white/80 bg-white/70 text-zinc-700 dark:border-white/15 dark:bg-dark-800 dark:text-zinc-300"
            }`}
          />
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              tabIndex={showFilters ? 0 : -1}
              className="inline-flex h-7 items-center gap-1 rounded-xl px-2.5 text-xs font-medium text-red-500 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
        <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
          Pág. {pagination.pageIndex + 1} de{" "}
          {Math.max(table.getPageCount(), 1)}
        </span>
      </div>

      {filteredProductsCount === 0 ? (
        <div className="p-20 text-center">
          <div className="flex justify-center mb-6 opacity-20">
            <PackageX size={64} />
          </div>
          <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            No se encontraron productos
          </h3>
        </div>
      ) : (
        <>
          {/* Tabla Tradicional */}
          <div
            className={`overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent] ${isTableScrollable ? "max-h-[65vh] overflow-y-auto" : ""}`}
          >
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead
                className={`bg-white/40 dark:bg-dark-900/40 backdrop-blur-md border-b border-white/15 dark:border-white/10 ${isTableScrollable ? "sticky top-0 z-20" : ""}`}
              >
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b border-white/15 dark:border-white/10"
                  >
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-5 py-3.5 text-[11px] font-bold text-[#2277B4] dark:text-blue-300 uppercase tracking-wider ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none hover:bg-white/40 dark:hover:bg-dark-800 transition-colors"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 ${header.column.id === "actions" ? "justify-center" : ""}`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-zinc-400 dark:text-zinc-500">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp
                                  size={12}
                                  className="text-blue-600 dark:text-blue-400"
                                />
                              ) : header.column.getIsSorted() ===
                                "desc" ? (
                                <ChevronDown
                                  size={12}
                                  className="text-blue-600 dark:text-blue-400"
                                />
                              ) : (
                                <ChevronsUpDown
                                  size={12}
                                  className="opacity-50"
                                />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-white/20 dark:divide-white/5">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ProductsPagination
            pagination={pagination}
            setPagination={setPagination}
            table={table}
          />
        </>
      )}
    </div>
  );
}
