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
      <div className="p-16 text-center bg-white dark:bg-dark-800 rounded-3xl border border-zinc-100 dark:border-dark-700 shadow-sm">
        <div className="animate-spin size-10 border-4 border-blue-500 dark:border-blue-400 border-t-transparent dark:border-t-transparent rounded-full mx-auto mb-4 scale-110" />
        <p className="text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
          Analizando catálogo de productos...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-zinc-200 dark:border-dark-700 shadow-sm overflow-hidden glass-panel">
      {/* Toolbar de tabla / Filtros */}
      <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-end gap-3 bg-zinc-50/50 dark:bg-dark-900/50">
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
              <button
                key={button.id}
                type="button"
                onClick={() => onOpenFilterPicker(button.id)}
                tabIndex={showFilters ? 0 : -1}
                className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                  selectedValue
                    ? "border-[#2277B4] bg-[#2277B4] text-white dark:border-blue-600 dark:bg-blue-700 dark:text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-dark-700 dark:bg-dark-800 dark:text-zinc-300 dark:hover:bg-dark-700"
                }`}
              >
                {button.buttonLabel}
              </button>
            );
          })}
          <select
            aria-label="Filtrar por tipo"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            tabIndex={showFilters ? 0 : -1}
            className={`h-7 min-w-28 rounded-md border px-2 text-xs font-semibold outline-none transition-colors dark:[color-scheme:dark] focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 ${
              filterType
                ? "border-[#2277B4] bg-white text-zinc-700 dark:border-blue-400 dark:bg-dark-800 dark:text-zinc-300"
                : "border-zinc-200 bg-white text-zinc-700 focus:border-[#2277B4] dark:border-dark-700 dark:bg-dark-800 dark:text-zinc-300 dark:focus:border-blue-400"
            }`}
          >
            <option value="">Tipo</option>
            <option value="PRODUCT">Productos</option>
            <option value="CONTPAQI">CONTPAQi</option>
            <option value="SERVICE">Servicios</option>
            <option value="POLICY">Pólizas</option>
          </select>
          <input
            type="number"
            min="0"
            aria-label="Precio mínimo"
            value={filterPriceMin}
            onChange={(event) => setFilterPriceMin(event.target.value)}
            placeholder="Precio mín."
            tabIndex={showFilters ? 0 : -1}
            className={`h-7 w-24 rounded-md border px-2 text-xs outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#2277B4] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 dark:[color-scheme:dark] ${
              filterPriceMin !== ""
                ? "border-[#2277B4] bg-[#2277B4]/10 text-[#125280] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-dark-700 dark:bg-dark-800 dark:text-zinc-300"
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
            className={`h-7 w-24 rounded-md border px-2 text-xs outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#2277B4] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 dark:[color-scheme:dark] ${
              filterPriceMax !== ""
                ? "border-[#2277B4] bg-[#2277B4]/10 text-[#125280] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-dark-700 dark:bg-dark-800 dark:text-zinc-300"
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
            className={`h-7 w-24 rounded-md border px-2 text-xs outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#2277B4] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#2277B4]/20 dark:focus:ring-blue-400/30 dark:[color-scheme:dark] ${
              filterUsers !== ""
                ? "border-[#2277B4] bg-[#2277B4]/10 text-[#125280] dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-dark-700 dark:bg-dark-800 dark:text-zinc-300"
            }`}
          />
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              tabIndex={showFilters ? 0 : -1}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-red-500 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
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
                className={isTableScrollable ? "sticky top-0 z-20" : ""}
              >
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="bg-zinc-100 dark:bg-dark-900 border-b border-zinc-200 dark:border-dark-700"
                  >
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-5 py-3 text-[11px] font-bold text-[#2277B4] dark:text-primary-400 uppercase tracking-wider ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-dark-800 transition-colors"
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
              <tbody className="divide-y divide-zinc-100/80 dark:divide-dark-700/80">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-dark-700/50 transition-colors"
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
