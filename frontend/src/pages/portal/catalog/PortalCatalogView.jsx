import React from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  Minus,
  PackageX,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "@icons";
import { flexRender } from "@tanstack/react-table";
import { FolioSelectionModal } from "../../home/products/FolioSelectionModal";
import {
  getProductIcon,
  getProductTypePresentation,
  PRODUCT_TYPE_FILTER_OPTIONS,
} from "../productPresentation";
import { updateQuoteRequestCart } from "../quoteRequestCart";

export default function PortalCatalogView({ controller, tableState }) {
  const {
    activeFolioGroup,
    cartLines,
    cartProductCount,
    cartTotalItems,
    categories,
    categoryFilter,
    categoryPage,
    getQuantity,
    globalFilter,
    handleRequestQuote,
    handleSelectGroupProduct,
    isCategoriesModalOpen,
    isSubmitting,
    loading,
    selectedProduct,
    setActiveFolioGroup,
    setCart,
    setCategoryFilter,
    setCategoryPage,
    setGlobalFilter,
    setIsCategoriesModalOpen,
    setSelectedProduct,
    setTypeFilter,
    totalCategoryPages,
    typeFilter,
    updateCart,
    visibleCategories,
  } = controller;

  const { columns, isTableScrollable, table } = tableState;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <ShoppingBag className="text-black dark:text-zinc-100" size={24} /> Catálogo de
            Productos
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Explora nuestras soluciones y solicita una cotización personalizada.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Búsqueda global */}
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar productos…"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-9 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400 outline-none transition-all w-full bg-white dark:bg-zinc-900"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtro por categoría */}
          <button
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400 outline-none transition-all bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 cursor-pointer flex items-center justify-between min-w-[180px] hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <span>{categoryFilter === "ALL" ? "Buscar categorías" : categoryFilter}</span>
            <ChevronDown size={16} className="text-zinc-400 dark:text-zinc-500 ml-2" />
          </button>

          {/* Filtro por tipo */}
          <div className="relative">
            <select
              aria-label="Filtrar por tipo"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-4 pr-10 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400 outline-none transition-all bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 cursor-pointer min-w-[150px] appearance-none h-full bg-no-repeat"
            >
              <option value="ALL">Todos los tipos</option>
              {PRODUCT_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="text-zinc-400 dark:text-zinc-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filtros Activos */}
      {(globalFilter || categoryFilter !== "ALL" || typeFilter !== "ALL") && (
        <div className="flex flex-wrap items-center gap-2 mt-[-0.5rem] mb-2">
          {globalFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-500/30">
              Texto: &quot;{globalFilter}&quot;
              <button type="button" onClick={() => setGlobalFilter("")}>
                <X size={10} />
              </button>
            </span>
          )}
          {categoryFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-500/30">
              Cat: {categoryFilter}
              <button type="button" onClick={() => setCategoryFilter("ALL")}>
                <X size={10} />
              </button>
            </span>
          )}
          {typeFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-500/30">
              Tipo: {getProductTypePresentation(typeFilter).label}
              <button type="button" onClick={() => setTypeFilter("ALL")}>
                <X size={10} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setGlobalFilter("");
              setCategoryFilter("ALL");
              setTypeFilter("ALL");
            }}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium flex items-center gap-1 ml-1"
          >
            <X size={12} /> Limpiar
          </button>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
          Cargando catálogo...
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm dark:shadow-black/20 overflow-hidden">
          <div className={`overflow-x-auto ${isTableScrollable ? "max-h-[420px] overflow-y-auto" : ""}`}>
            <table className="w-full text-sm">
              <thead className={`bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-700 ${isTableScrollable ? "sticky top-0 z-20" : ""}`}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{
                          width:
                            header.getSize() !== 150 ?
                              header.getSize()
                            : undefined,
                        }}
                        className="px-5 py-3.5 text-left font-semibold text-zinc-600 dark:text-zinc-300 select-none"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" : ""}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-zinc-400 dark:text-zinc-500">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronUp size={14} />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronsUpDown size={14} />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-16 text-zinc-400 dark:text-zinc-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
                          <PackageX size={28} className="text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No se encontraron productos.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/70 ${
                        getQuantity(row.original.id) > 0 ?
                          "bg-emerald-50/40 dark:bg-emerald-500/10 border-l-2 border-l-emerald-500 dark:border-l-emerald-400"
                        : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <span>
              <strong>
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                –
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}
              </strong>{" "}
              de <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
              productos
            </span>

            <div className="flex items-center gap-2">
              <select
                aria-label="Registros por página"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400"
              >
                {[5, 10, 20, 50].map((s) => (
                  <option key={s} value={s}>
                    {s} por página
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium px-2 min-w-[80px] text-center">
                Pág. {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount()}
              </span>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
          <div className="bg-[#1B4733] dark:bg-emerald-950 text-white shadow-2xl dark:shadow-black/50 rounded-2xl border border-emerald-900/20 dark:border-emerald-800 p-4 flex flex-col gap-4 max-w-4xl w-full md:flex-row md:items-center">
            <div className="flex items-center justify-center size-12 rounded-xl backdrop-blur-sm">
              <ShoppingCart size={24} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-lg leading-tight">
                {cartProductCount}{" "}
                {cartProductCount === 1 ? "producto" : "productos"} en solicitud
              </div>
              <div className="text-sm text-emerald-50/80 dark:text-emerald-100/80">
                {cartTotalItems}{" "}
                {cartTotalItems === 1 ? "unidad seleccionada" : "unidades seleccionadas"}
              </div>
              <div className="mt-3 flex max-h-28 flex-col gap-2 overflow-y-auto pr-1">
                {cartLines.map(({ product_id, quantity, product }) => (
                  <div
                    key={product_id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/10 dark:bg-white/10 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {product?.name || "Producto"}
                      </div>
                      {product?.folio && (
                        <div className="truncate text-xs text-emerald-50/70 dark:text-emerald-100/70">
                          {product.folio}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 dark:bg-white/10 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCart(product_id, -1)}
                        disabled={isSubmitting}
                        aria-label={`Quitar una unidad de ${product?.name || "producto"}`}
                        className="size-7 flex items-center justify-center rounded-md text-white dark:text-white hover:bg-white/15 dark:hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-6 text-center text-xs font-bold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCart(product_id, 1)}
                        disabled={isSubmitting}
                        aria-label={`Agregar una unidad de ${product?.name || "producto"}`}
                        className="size-7 flex items-center justify-center rounded-md text-white dark:text-white hover:bg-white/15 dark:hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCart((prev) => updateQuoteRequestCart(prev, product_id, -quantity))}
                        disabled={isSubmitting}
                        aria-label={`Eliminar ${product?.name || "producto"} de la solicitud`}
                        className="size-7 flex items-center justify-center rounded-md text-red-100 dark:text-red-200 hover:bg-red-500/20 dark:hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 md:self-end">
              <button
                type="button"
                onClick={() => setCart({})}
                disabled={isSubmitting}
                className="bg-red-500/10 dark:bg-red-400/10 hover:bg-red-500/20 dark:hover:bg-red-400/20 text-red-100 dark:text-red-200 font-bold py-3 px-6 rounded-xl transition-colors disabled:bg-red-500/5 dark:disabled:bg-red-950/20 disabled:text-red-100/50 dark:disabled:text-red-400/50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={18} /> Cancelar
              </button>
              <button
                type="button"
                onClick={handleRequestQuote}
                disabled={isSubmitting}
                className="bg-white dark:bg-emerald-300 text-[#1B4733] dark:text-emerald-950 hover:bg-zinc-100 dark:hover:bg-emerald-200 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm dark:shadow-black/20 disabled:bg-zinc-200 dark:disabled:bg-emerald-950 disabled:text-zinc-500 dark:disabled:text-emerald-500 disabled:opacity-100 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ?
                  "Enviando…"
                : <>
                    <CheckCircle size={18} /> Solicitar
                  </>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de categorías */}
      {isCategoriesModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 dark:bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl dark:shadow-black/50 animate-fade-in relative border border-zinc-200 dark:border-zinc-700">
              <div className="p-4 rounded-t-2xl border-b border-white/10 dark:border-zinc-700 bg-[#1B4733] dark:bg-emerald-950 flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">Categorías</h2>
                <button
                  type="button"
                  onClick={() => setIsCategoriesModalOpen(false)}
                  className="text-white/70 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-3">
                    Categorías
                  </h3>
                  {categories.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Aún no hay categorías registradas.
                    </p>
                  ) : (
                    <div className="min-h-[190px] flex flex-col">
                      <div className="flex flex-wrap content-start gap-2 h-[138px] overflow-hidden pr-1">
                        {visibleCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(category);
                              setIsCategoriesModalOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                              category === categoryFilter ?
                                "border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {category === "ALL" ? "TODAS LAS CATEGORÍAS" : category}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Página {categoryPage} de {totalCategoryPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={categoryPage === 1}
                            className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPage((prev) =>
                                Math.min(totalCategoryPages, prev + 1),
                              )
                            }
                            disabled={categoryPage === totalCategoryPages}
                            className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Detalles del Producto */}
      {selectedProduct &&
        createPortal(
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl dark:shadow-black/50 animate-fade-in relative border border-zinc-200 dark:border-zinc-700">
              {/* Encabezado del Modal */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-[#1a2b4c] dark:bg-zinc-950 flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">Detalles del Producto</h2>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-white/70 dark:text-white/70 hover:text-white dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 dark:hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo del Modal */}
              <div className="p-6 space-y-6">
                {/* Cabecera del Producto */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 shadow-sm dark:shadow-black/20">
                      {(() => {
                        const Logo = getProductIcon(selectedProduct);
                        return <Logo size={32} className="text-[#2277B4] dark:text-blue-400" />;
                      })()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/30">
                        {selectedProduct.category}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getProductTypePresentation(selectedProduct.product_type).badgeClass}`}>
                        {getProductTypePresentation(selectedProduct.product_type).label}
                      </span>
                      {selectedProduct.folio && (
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                          {selectedProduct.folio}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {selectedProduct.name}
                    </h3>
                  </div>
                </div>

                {/* Caja de Descripción */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Descripción
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    {selectedProduct.description || "Este producto no tiene una descripción disponible actualmente."}
                  </p>
                </div>

                {/* Sección de Acciones */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block">
                      Estado en cotización
                    </span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {getQuantity(selectedProduct.id) > 0 ? "Agregado a la solicitud" : "No agregado"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getQuantity(selectedProduct.id) === 0 ? (
                      <button
                        type="button"
                        onClick={() => updateCart(selectedProduct.id, 1)}
                        className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 text-white dark:text-emerald-950 px-5 py-2.5 rounded-xl transition-all shadow-md dark:shadow-black/30 active:scale-95 cursor-pointer"
                      >
                        <Plus size={16} /> Solicitar cotización
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 shadow-sm dark:shadow-black/20">
                        <button
                          type="button"
                          onClick={() => updateCart(selectedProduct.id, -1)}
                          className="size-8 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-zinc-800 dark:text-white min-w-[1.5rem] text-center text-sm">
                          {getQuantity(selectedProduct.id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCart(selectedProduct.id, 1)}
                          className="size-8 flex items-center justify-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <FolioSelectionModal
        group={activeFolioGroup}
        onClose={() => setActiveFolioGroup(null)}
        onSelect={handleSelectGroupProduct}
      />
    </div>
  );
}
