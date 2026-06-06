import { createPortal } from "react-dom";
import { Search, ShoppingBag, X } from "@icons";
import Input from "../../../components/ui/Input";
import { flexRender } from "@tanstack/react-table";

export default function ProductSearchModal({
  isOpen,
  prodSearch,
  onSearchChange,
  onClose,
  productSearchTable,
  isProductSearching,
  prodResults,
  filteredProductCount = prodResults.length,
  productTypeFilter = "",
  onProductTypeFilterChange,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-[#1a2b4c]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Buscar Productos
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              Selecciona productos para agregar a la cotización
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px] shrink-0">
            <div className="relative">
              <Input
                value={prodSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar producto por folio, nombre o categoría…"
                className="w-full glass-input bg-light-bg dark:!bg-black/30 text-light-text-primary dark:text-white border-light-border dark:border-white/10"
                style={{ paddingRight: "2.5rem" }}
                autoFocus
              />
              <Search
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary"
              />
            </div>

            <select
              value={productTypeFilter}
              onChange={(e) => onProductTypeFilterChange?.(e.target.value)}
              className="h-[48px] rounded-xl border border-light-border dark:border-dark-700 bg-white dark:bg-dark-900 px-3 text-sm font-semibold text-[#1a2b4c] dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500"
              aria-label="Filtrar productos por tipo"
            >
              <option value="">Todos los tipos</option>
              <option value="PRODUCT">Productos normales</option>
              <option value="CONTPAQI">Productos CONTPAQi</option>
              <option value="SERVICE">Servicios</option>
              <option value="POLICY">Pólizas</option>
            </select>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl dark:border-white/10 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-auto relative">
              <table className="w-full text-left text-sm table-fixed">
                <thead className="sticky top-0 z-10">
                  {productSearchTable.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="bg-zinc-50/95 dark:bg-dark-800/95 backdrop-blur-sm border-b border-light-border dark:border-dark-700 shadow-sm">
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-4 py-3 text-[11px] font-bold text-light-text-secondary uppercase tracking-wider ${
                            header.id === "current_price" ?
                              "text-right w-28 sm:w-32"
                            : header.id === "actions" ?
                              "text-right w-36 sm:w-40"
                            : "w-full"
                          }`}>
                          {header.isPlaceholder ? null :
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-light-border">
                  {isProductSearching ?
                    <tr>
                      <td colSpan="3" className="py-12 text-center">
                        <Search size={48} className="mx-auto mb-3 opacity-20 animate-spin" />
                        <p className="text-light-text-secondary dark:text-zinc-400 font-medium">
                          Buscando productos...
                        </p>
                      </td>
                    </tr>
                  : productSearchTable.getRowModel().rows.length > 0 ?
                    productSearchTable.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-light-bg/50 dark:hover:bg-white/5 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`p-4 ${
                              cell.column.id === "current_price" ? "text-right" : ""
                            }`}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  : <tr>
                      <td colSpan="3" className="py-12 text-center">
                        <div className="flex justify-center mb-3 opacity-20">
                          <ShoppingBag size={48} />
                        </div>
                        <p className="text-light-text-secondary dark:text-zinc-400 font-medium">
                          {productTypeFilter && prodResults.length > 0
                            ? "No hay productos para el tipo seleccionado."
                            : prodSearch.trim().length > 0
                            ? `No se encontraron productos con "${prodSearch}"`
                            : "No hay productos disponibles."}
                        </p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            {!isProductSearching && filteredProductCount > 0 && (
              <div className="px-4 py-3 border-t border-light-border dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <label className="text-sm text-light-text-secondary dark:text-zinc-400 flex items-center gap-2">
                  Mostrar
                  <select
                    value={productSearchTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      productSearchTable.setPageSize(Number(e.target.value));
                      productSearchTable.setPageIndex(0);
                    }}
                    className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-[#fff] dark:bg-dark-900 border border-light-border dark:border-dark-700">
                    {[5, 10, 25, 50].map((size) => (
                      <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                        {size}
                      </option>
                    ))}
                  </select>
                  por página
                </label>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => productSearchTable.setPageIndex(0)}
                    disabled={!productSearchTable.getCanPreviousPage()}
                    className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    ««
                  </button>
                  <button
                    onClick={() => productSearchTable.previousPage()}
                    disabled={!productSearchTable.getCanPreviousPage()}
                    className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Anterior
                  </button>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mx-2">
                    Pág. {productSearchTable.getState().pagination.pageIndex + 1} de {productSearchTable.getPageCount()}
                  </span>
                  <button
                    onClick={() => productSearchTable.nextPage()}
                    disabled={!productSearchTable.getCanNextPage()}
                    className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Siguiente
                  </button>
                  <button
                    onClick={() =>
                      productSearchTable.setPageIndex(productSearchTable.getPageCount() - 1)
                    }
                    disabled={!productSearchTable.getCanNextPage()}
                    className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-dark-700 flex justify-between items-center bg-zinc-50 dark:bg-dark-900">
          <p className="text-xs text-light-text-secondary dark:text-zinc-400">
            {filteredProductCount > 0 && (
              <span>{filteredProductCount} producto(s) encontrado(s)</span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white font-semibold transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
