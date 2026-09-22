import React, { useMemo } from "react";
import ClientFilterPicker from "../clients/ClientFilterPicker";
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Package,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "@icons";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createAcceptedSalesColumns } from "./acceptedSalesColumns";
import { SaleSummaryModal, StatCard } from "./acceptedSalesHelpers";
import { SALES_FILTER_BUTTONS } from "./acceptedSalesConstants";

export default function AcceptedSalesView({ controller }) {
  const {
    activeFilterCount,
    activeFilterPickerConfig,
    activeFilterPickerField,
    applyFilterValue,
    clearFilters,
    closeSaleSummary,
    creatingSale,
    error,
    filterPickerOptions,
    filterPickerPage,
    filterPickerSearch,
    filteredSales,
    filters,
    handleCreateSale,
    handleDeleteSale,
    handleExportExcel,
    handleExportPDF,
    loading,
    metrics,
    openFilterPicker,
    openSaleSummary,
    pagination,
    q,
    selectedSale,
    setActiveFilterPickerField,
    setFilterPickerPage,
    setFilterPickerSearch,
    setPagination,
    setQ,
    setSorting,
    showFilters,
    sorting,
    toggleFilters,
  } = controller;

  const columns = useMemo(
    () => createAcceptedSalesColumns({ openSaleSummary, handleDeleteSale }),
    [handleDeleteSale, openSaleSummary],
  );

  const table = useReactTable({
    data: filteredSales,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const visibleSalesRowsCount = table.getRowModel().rows.length;
  const isTableScrollable = visibleSalesRowsCount > 5;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Cotizaciones
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Cotizaciones generadas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-white/80 dark:border-white/15 bg-white/70 p-1 dark:bg-dark-900/70 backdrop-blur-md shadow-glass-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cotización, folio, cliente o contacto…"
              className="w-52 border-none bg-transparent px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 md:w-72"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
            <div className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
              <Search size={16} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-red-700 transition-all hover:bg-white/95 dark:border-red-900/50 dark:bg-dark-900/60 dark:text-red-400 dark:hover:bg-red-900/20 backdrop-blur-md shadow-glass-sm"
            title="Exportar a PDF"
          >
            <FileText size={14} /> Exportar a PDF
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-white/95 dark:border-emerald-900/50 dark:bg-dark-900/60 dark:text-emerald-400 dark:hover:bg-emerald-900/20 backdrop-blur-md shadow-glass-sm"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={14} /> Exportar a Excel
          </button>

          <button
            type="button"
            onClick={toggleFilters}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all backdrop-blur-md shadow-glass-sm ${
              showFilters || activeFilterCount > 0
                ? "border-[#2277B4] bg-[#2277B4] text-white dark:border-blue-600 dark:bg-blue-600"
                : "border-white/80 bg-white/70 text-zinc-700 hover:bg-white/95 dark:border-white/15 dark:bg-dark-900/60 dark:text-zinc-300 dark:hover:bg-dark-800"
            }`}
          >
            <SlidersHorizontal size={15} /> Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#2277B4] dark:text-blue-600">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Clientes con cotizaciones" value={metrics.uniqueClients} helper="" tone="blue" />
        <StatCard icon={Users} label="Contactos con cotizaciones" value={metrics.uniqueContacts} helper="" tone="blue" />
        <StatCard icon={Package} label="Cotizaciones" value={metrics.totalSales} helper="" tone="amber" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="glass-panel glass-mirror overflow-hidden rounded-2xl border border-white/25 dark:border-white/10 bg-white/35 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass-sm dark:shadow-glass-mirror">
        <div className="flex min-h-[44px] flex-wrap items-center gap-2 border-b border-white/15 dark:border-white/10 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md px-5 py-3.5 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="mr-auto" />
          {showFilters && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {SALES_FILTER_BUTTONS.map((button) => {
                const selectedValue = filters[button.fieldName];
                return (
                  <div
                    key={button.id}
                    className={`inline-flex items-center rounded-xl border text-xs transition-colors backdrop-blur-md shadow-glass-sm ${
                      selectedValue
                        ? "border-[#2277B4] bg-white/90 dark:bg-dark-900 text-zinc-800 dark:text-zinc-200 dark:border-blue-500"
                        : "border-white/80 bg-white/70 text-zinc-700 hover:bg-white/95 dark:border-white/15 dark:bg-dark-900/70 dark:text-zinc-200 dark:hover:bg-dark-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openFilterPicker(button.fieldName)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold px-3 py-1 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-l-xl transition-colors"
                    >
                      <span className={selectedValue ? "text-[#2277B4] dark:text-blue-400 font-bold" : ""}>
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
                        onClick={() => applyFilterValue(button.fieldName, "")}
                        className="pr-2 pl-0.5 py-1 text-black hover:text-red-500 dark:text-zinc-100 dark:hover:text-red-400 transition-colors flex items-center justify-center focus:outline-none"
                        title={`Quitar filtro ${button.buttonLabel}`}
                      >
                        <X size={12} className="text-black dark:text-zinc-100 hover:text-red-500" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                );
              })}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                >
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>
          )}
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
          </span>
        </div>

        <div
          className={`overflow-x-auto ${
            isTableScrollable ? "max-h-[420px] overflow-y-auto" : ""
          }`}
        >
          <table className="w-full border-collapse text-left">
            <thead
              className={`border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-dark-900/40 backdrop-blur-md text-xs uppercase text-[#2277B4] dark:text-blue-300 ${
                isTableScrollable ? "sticky top-0 z-20" : ""
              }`}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ChevronUp size={14} />}
                        {header.column.getIsSorted() === "desc" && <ChevronDown size={14} />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    Cargando cotizaciones...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium">No se encontraron cotizaciones.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-white/50 dark:hover:bg-white/[0.04]">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredSales.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-white/15 dark:border-white/10 bg-white/30 dark:bg-dark-900/30 backdrop-blur-md px-5 py-3.5">
            <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              Mostrar
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  }))
                }
                className="rounded-xl border border-white/80 dark:border-white/15 bg-white/70 dark:bg-dark-900/70 backdrop-blur-md px-2.5 py-1 text-sm text-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-glass-sm"
              >
                {[5, 10, 25, 50, 100].map((size) => (
                  <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                    {size}
                  </option>
                ))}
              </select>
              por página
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 px-2.5 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                ««
              </button>
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                Siguiente
              </button>
              <button
                type="button"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/5 px-2.5 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white/95 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 shadow-glass-sm"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      <ClientFilterPicker
        isOpen={Boolean(activeFilterPickerField) && showFilters}
        onClose={() => setActiveFilterPickerField(null)}
        fieldName={activeFilterPickerField}
        fieldConfig={activeFilterPickerConfig}
        filters={filters}
        options={filterPickerOptions}
        filterPickerSearch={filterPickerSearch}
        setFilterPickerSearch={setFilterPickerSearch}
        filterPickerPage={filterPickerPage}
        setFilterPickerPage={setFilterPickerPage}
        onApplyFilter={applyFilterValue}
      />

      <SaleSummaryModal
        sale={selectedSale}
        onClose={closeSaleSummary}
        onCreateSale={handleCreateSale}
        creatingSale={creatingSale}
      />
    </div>
  );
}
