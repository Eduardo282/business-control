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
import { createPoliciesColumns } from "./policiesColumns";
import { SaleSummaryModal, StatCard } from "./policiesHelpers";
import { SALES_FILTER_BUTTONS } from "./policyConstants";

export default function PoliciesView({ controller }) {
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
    () => createPoliciesColumns({ openSaleSummary, handleDeleteSale }),
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
      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900">
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
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-dark-700 dark:bg-dark-800">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-dark-900 dark:text-red-400 dark:hover:bg-red-900/10"
            >
              <FileText size={14} /> Exportar a PDF
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-dark-900 dark:text-emerald-400 dark:hover:bg-emerald-900/10"
            >
              <FileSpreadsheet size={14} /> Exportar a Excel
            </button>

            <button
              type="button"
              onClick={toggleFilters}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-[#2277B4] bg-[#2277B4] text-white dark:border-blue-600 dark:bg-blue-600"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-dark-700 dark:bg-dark-900 dark:text-zinc-300 dark:hover:bg-dark-800"
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

      <div className="glass-panel overflow-hidden rounded-md border border-zinc-200 shadow-sm dark:border-dark-700 dark:bg-dark-900">
        <div className="flex min-h-[44px] flex-wrap items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs text-zinc-600 dark:border-dark-700 dark:bg-dark-800/50 dark:text-zinc-400">
          <span className="mr-auto" />
          {showFilters && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {SALES_FILTER_BUTTONS.map((button) => {
                const selectedValue = filters[button.fieldName];
                return (
                  <div
                    key={button.id}
                    className={`inline-flex items-center rounded-md border text-xs transition-colors ${
                      selectedValue
                        ? "border-[#2277B4] bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-200 dark:border-blue-500 shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-dark-700 dark:bg-dark-900 dark:text-zinc-200 dark:hover:bg-dark-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openFilterPicker(button.fieldName)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold px-3 py-1 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-l-md transition-colors"
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
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
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
              className={`border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-[#2277B4] shadow-[0_1px_0_rgba(228,228,231,1)] dark:border-dark-700 dark:bg-dark-800 dark:text-blue-400 dark:shadow-[0_1px_0_rgba(63,63,70,1)] ${
                isTableScrollable ? "sticky top-0 z-20" : ""
              }`}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="bg-zinc-50 p-4 dark:bg-dark-800"
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
            <tbody className="divide-y divide-zinc-100 bg-white text-sm dark:divide-dark-700 dark:bg-dark-900">
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
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/5">
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
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-white px-4 py-3 dark:border-dark-700 dark:bg-dark-900">
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
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-dark-700 dark:bg-dark-900 dark:text-zinc-100"
              >
                {[5, 10, 25, 50, 100].map((size) => (
                  <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                    {size}
                  </option>
                ))}
              </select>
              por página
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="rounded-lg bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                ««
              </button>
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-lg bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-lg bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                Siguiente
              </button>
              <button
                type="button"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="rounded-lg bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
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
