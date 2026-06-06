import { useMemo } from "react";
import { createPortal } from "react-dom";
import {
  usePolicies,
  formatSaleMoney,
  formatSaleDateTime,
  getSaleProductsSummary,
} from "./policies/usePolicies";
import {
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Package,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "@icons";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

function StatCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-[#2277B4] dark:bg-blue-500/10 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {helper}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone] || tones.blue}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function SaleSummaryModal({ sale, onClose }) {
  if (!sale) return null;

  const summary = getSaleProductsSummary(sale);
  const items = sale.items || [];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-dark-700 dark:bg-dark-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-[#1a2b4c] px-6 py-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">
              Resumen de venta
            </p>
            <h2 className="mt-2 text-2xl font-bold">Venta #{sale.id}</h2>
            <code className="mt-2 inline-flex rounded-md bg-white/10 px-2 py-1 font-mono text-xs font-bold text-blue-100">
              {sale.folio || "Sin folio"}
            </code>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-white transition-colors hover:bg-white/10"
            aria-label="Cerrar resumen de venta"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Cliente
              </p>
              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {sale.client?.business_name || "Sin cliente"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Contacto
              </p>
              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {sale.contact?.full_name || "Sin contacto"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {sale.contact?.email || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Total
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {formatSaleMoney(sale.total)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Fecha de venta
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {formatSaleDateTime(sale.registered_at || sale.created_at)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Productos cotizados
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {summary.detail}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-dark-700">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-dark-700">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Detalle de productos
              </p>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-dark-700">
              {items.length === 0 ? (
                <div className="px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin productos registrados en esta venta.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                        {item.product?.name || "Producto sin nombre"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.product?.folio || item.product?.category || "—"}
                      </p>
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-300">
                      Cantidad: <span className="font-bold">{item.quantity || 1}</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {formatSaleMoney(item.total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Policies() {
  const {
    loading,
    error,
    q,
    setQ,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    selectedSale,
    clearFilters,
    activeFilterCount,
    filterOptions,
    filteredSales,
    metrics,
    openSaleSummary,
    closeSaleSummary,
    handleDeleteSale,
    handleExportPDF,
    handleExportExcel,
  } = usePolicies();

  const columns = useMemo(
    () => [
      {
        id: "sale",
        header: "Venta",
        accessorFn: (row) => row.folio || row.id,
        cell: ({ row }) => {
          const sale = row.original;
          return (
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                Venta #{sale.id}
              </div>
              <code className="mt-1 inline-flex rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#2277B4] dark:bg-blue-500/10 dark:text-blue-300">
                {sale.folio || "Sin folio"}
              </code>
            </div>
          );
        },
      },
      {
        id: "client",
        header: "Cliente",
        accessorFn: (row) => row.client?.business_name || "",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">
              {row.original.client?.business_name || "Sin cliente"}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Cliente de la cotización
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contacto",
        accessorFn: (row) => row.contact?.full_name || "",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-zinc-700 dark:text-zinc-200">
              {row.original.contact?.full_name || "Sin contacto"}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {row.original.contact?.email || "—"}
            </div>
          </div>
        ),
      },
      {
        id: "products",
        header: "Productos",
        accessorFn: (row) => getSaleProductsSummary(row).title,
        cell: ({ row }) => {
          const summary = getSaleProductsSummary(row.original);
          return (
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                {summary.title}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {summary.detail}
              </div>
            </div>
          );
        },
      },
      {
        id: "total",
        header: "Total",
        accessorFn: (row) => Number(row.total) || 0,
        cell: ({ row }) => (
          <div className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300">
            {formatSaleMoney(row.original.total)}
          </div>
        ),
      },
      {
        id: "saleDate",
        header: "Fecha venta",
        accessorFn: (row) => row.registered_at || row.created_at || "",
        cell: ({ row }) => (
          <div className="text-zinc-700 dark:text-zinc-300">
            {formatSaleDateTime(row.original.registered_at || row.original.created_at)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openSaleSummary(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-[#2277B4] transition-colors hover:bg-blue-50 dark:border-blue-500/20 dark:bg-dark-900 dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              <ExternalLink size={14} /> Ver
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSale(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:bg-dark-900 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        ),
      },
    ],
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

  return (
    <div className="space-y-8 pb-20">
      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-dark-700 dark:bg-dark-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Ventas
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ventas generadas por cotizaciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-dark-700 dark:bg-dark-800">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar venta, folio, cliente o contacto…"
                className="w-52 border-none bg-transparent px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 md:w-72"
              />
              <div className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500">
                <Search size={16} />
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-dark-900 dark:text-red-400 dark:hover:bg-red-900/10"
            >
              <FileText size={14} /> Exportar a PDF
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-dark-900 dark:text-emerald-400 dark:hover:bg-emerald-900/10"
            >
              <FileSpreadsheet size={14} /> Exportar a Excel
            </button>

            <button
              onClick={() => setShowFilters((v) => !v)}
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

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
              >
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 grid gap-3 border-t border-zinc-100 pt-5 dark:border-dark-700 md:grid-cols-2">
            <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Cliente
              <select
                value={filters.client}
                onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal normal-case text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-dark-700 dark:bg-dark-900 dark:text-zinc-100"
              >
                <option value="">Todos</option>
                {filterOptions.clients.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Contacto
              <select
                value={filters.contact}
                onChange={(e) => setFilters((prev) => ({ ...prev, contact: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal normal-case text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-dark-700 dark:bg-dark-900 dark:text-zinc-100"
              >
                <option value="">Todos</option>
                {filterOptions.contacts.map((contact) => (
                  <option key={contact} value={contact}>{contact}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={BadgeDollarSign} label="Total vendido" value={formatSaleMoney(metrics.totalAmount)} helper={`${metrics.totalSales} venta(s) visibles`} tone="emerald" />
        <StatCard icon={Users} label="Clientes" value={metrics.uniqueClients} helper="Clientes con ventas" tone="blue" />
        <StatCard icon={Package} label="Contactos" value={metrics.uniqueContacts} helper="Contactos con cotización registrada" tone="amber" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="glass-panel overflow-hidden rounded-md border border-zinc-200 shadow-sm dark:border-dark-700 dark:bg-dark-900">
        <div className="flex min-h-[44px] items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs text-zinc-600 dark:border-dark-700 dark:bg-dark-800/50 dark:text-zinc-400">
          <span>Ventas tomadas de cotizaciones registradas y publicadas al portal.</span>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-[#2277B4] dark:border-dark-700 dark:bg-dark-800 dark:text-blue-400">
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
            <tbody className="divide-y divide-zinc-100 bg-white text-sm dark:divide-dark-700 dark:bg-dark-900">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    Cargando ventas...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium">No se encontraron ventas.</p>
                      <p className="max-w-md text-xs text-zinc-400">
                        Registra una cotización y publícala al portal del contacto para verla aquí como venta.
                      </p>
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
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="rounded-lg bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-lg bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-lg bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                Siguiente
              </button>
              <button
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

      <SaleSummaryModal sale={selectedSale} onClose={closeSaleSummary} />
    </div>
  );
}
