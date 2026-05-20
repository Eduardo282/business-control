import { useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  usePolicies,
  inferPolicyType,
  getPolicyStatusLabel,
  getPolicyStatusClass,
  formatPolicyDate,
} from "./policies/usePolicies";
import LicenseTable from "./policies/LicenseTable";
import AssignPolicyModal from "./policies/AssignPolicyModal";
import EditPolicyModal from "./policies/EditPolicyModal";
import PolicyFilterPicker from "./policies/PolicyFilterPicker";
import { createPortal } from "react-dom";

import {
  FileSpreadsheet,
  FileText,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  UserPlus,
  X,
  FolderOpen,
} from "@icons";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

export default function Policies() {
  const { user } = useContext(AuthContext);

  const {
    policies,
    loading,
    error,
    q,
    setQ,
    showFilters,
    setShowFilters,
    activeFilterPickerField,
    filters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    editingRow,
    setEditingRow,
    viewingFoliosGroup,
    setViewingFoliosGroup,
    selectedFoliosByGroup,
    setSelectedFoliosByGroup,
    assignModalOpen,
    assignTarget,
    load,
    clearFilters,
    activeFilterCount,
    openFilterPicker,
    closeFilterPicker,
    applyFilterValue,
    openAssignModal,
    closeAssignModal,
    handleDelete,
    handleDeleteGroup,
    startEditRow,
    filteredGroups,
    handleExportPDF,
    handleExportExcel,
  } = usePolicies();

  const columns = useMemo(
    () => [
      {
        id: "product",
        header: "Servicios y pólizas",
        accessorFn: (row) => row.product?.name,
        cell: ({ row }) => {
          const g = row.original;
          const policyType = inferPolicyType(g.product);
          const typeLabel = policyType === "POLICY" ? "Póliza" : "Servicio";
          const typeClasses =
            policyType === "POLICY"
              ? "text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400"
              : "text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400";
          return (
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">
                    {g.product?.name || "—"}
                  </div>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded border ${typeClasses}`}>
                    {typeLabel}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {g.product?.category || ""}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "folio",
        header: "Folio",
        accessorFn: (row) => (row.licenseKeys || []).join(", "),
        cell: ({ row }) => {
          const g = row.original;
          const selectedId = selectedFoliosByGroup[g.id];
          const selectedItem = g.items?.find(
            (item) => String(item.id) === String(selectedId)
          );
          const displayItem = selectedItem || g.items?.[0] || null;
          if (!displayItem) return <span className="text-zinc-400">—</span>;
          const extraCount = Math.max(0, g.count - 1);
          const isClickable = g.count > 1;

          return (
            <div
              onClick={
                isClickable
                  ? (e) => {
                      e.stopPropagation();
                      setViewingFoliosGroup(g);
                    }
                  : undefined
              }
              className={`group relative inline-flex items-center gap-1.5 ${
                isClickable
                  ? "cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all"
                  : ""
              }`}
            >
              <code
                className={`text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-white/5 ${
                  isClickable
                    ? "group-hover:bg-zinc-100 dark:group-hover:bg-white/10 group-hover:border-zinc-200 dark:group-hover:border-white/10"
                    : ""
                }`}
              >
                {displayItem.license_key || "—"}
              </code>
              {isClickable && (
                <span className="text-[10px] font-bold text-[#2277B4] dark:text-blue-400 hover:underline">
                  +{extraCount}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "client",
        header: "Cliente",
        accessorFn: (row) => row.client?.business_name,
        cell: ({ row }) => (
          <div className="font-medium text-zinc-500 dark:text-zinc-300">
            {row.original.client?.business_name || "Sin Cliente"}
          </div>
        ),
      },
      {
        id: "validity",
        header: "Vigencia",
        accessorFn: (row) => row.expiration_date,
        cell: ({ row }) => {
          const g = row.original;
          const selectedId = selectedFoliosByGroup[g.id];
          const selectedItem = g.items?.find(
            (item) => String(item.id) === String(selectedId)
          );
          const displayItem = selectedItem || g.items?.[0] || null;
          const startDate = displayItem?.start_date || g.start_date;
          const expDate = displayItem?.expiration_date || g.expiration_date;
          return (
            <div className="text-zinc-700 dark:text-zinc-300">
              <div>
                Inicia: {startDate ? new Date(startDate).toLocaleDateString() : "—"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Vence: {expDate ? new Date(expDate).toLocaleDateString() : "—"}
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Estado",
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          const g = row.original;
          const selectedId = selectedFoliosByGroup[g.id];
          const selectedItem = g.items?.find(
            (item) => String(item.id) === String(selectedId)
          );
          const displayItem = selectedItem || g.items?.[0] || null;
          const status = displayItem?.status || g.status;
          const label = getPolicyStatusLabel(status);
          const cls = getPolicyStatusClass(status);
          return (
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${cls}`}>
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const g = row.original;
          if (user?.role?.name !== "ADMIN") return null;
          const isStandalone = String(g.id).startsWith("product-");
          const selectedId = selectedFoliosByGroup[g.id];
          const selectedItem = g.items?.find(
            (item) => String(item.id) === String(selectedId)
          );
          const hasSelected = Boolean(selectedItem);

          return (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => openAssignModal(g)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                title="Asignar a contacto"
              >
                <UserPlus size={16} />
              </button>
              {!isStandalone && (
                <button
                  onClick={() => startEditRow(g)}
                  className="size-8 inline-flex items-center justify-center rounded-lg text-[#2277B4] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                  title="Editar vigencia/estado"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
              )}
              <button
                onClick={() => {
                  if (hasSelected) {
                    handleDelete(selectedItem.id, g.id);
                    return;
                  }
                  g.count === 1
                    ? handleDelete(g.policyIds?.[0], g.id)
                    : handleDeleteGroup(g);
                }}
                className="size-8 inline-flex items-center justify-center rounded-lg text-red-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title={
                  hasSelected
                    ? "Eliminar folio seleccionado"
                    : g.count === 1
                    ? "Eliminar Póliza"
                    : `Eliminar ${g.count} pólizas`
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [user?.role?.name, selectedFoliosByGroup]
  );

  const table = useReactTable({
    data: filteredGroups,
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
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 p-6 rounded-md border border-zinc-200 dark:border-dark-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
            Historial de servicios y pólizas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg">
            Historial de servicios y pólizas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Búsqueda global */}
          <div className="flex gap-1 bg-white dark:bg-dark-800 p-1 rounded-lg border border-zinc-200 dark:border-dark-700">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar póliza o servicio…"
              className="bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 px-3 w-40 md:w-52 focus:outline-none"
            />
            <div className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500">
              <Search size={16} />
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-900/50 bg-white dark:bg-dark-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors whitespace-nowrap"
            title="Exportar a PDF"
          >
            <FileText size={14} /> Exportar a PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-dark-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors whitespace-nowrap"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={14} /> Exportar a Excel
          </button>

          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-600 dark:border-blue-600"
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-dark-900 dark:text-zinc-300 dark:border-dark-700 dark:hover:bg-dark-800"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-[#2277B4] dark:text-blue-600 rounded-full text-xs font-bold size-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Limpiar filtros */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="glass-panel dark:bg-dark-900 rounded-md overflow-hidden border border-zinc-200 dark:border-dark-700 shadow-sm">
        {/* Filtros */}
        <div className="px-4 py-2 bg-blue-50 dark:bg-dark-800/50 border-b border-blue-100 dark:border-dark-700 text-xs text-[#2277B4] dark:text-blue-400 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-1 shrink-0 text-zinc-600 dark:text-zinc-400">
            Click en el folio para ver y seleccionar.
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
              Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
            </span>
            {showFilters &&
              [{ id: "status", label: "Estado" }].map((button) => {
                const selectedValue = String(filters[button.id] || "");
                return (
                  <button
                    key={button.id}
                    onClick={() => openFilterPicker(button.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap ${
                      selectedValue
                        ? "bg-[#2277B4] text-white border-[#2277B4] dark:bg-blue-600 dark:border-blue-600"
                        : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-800"
                    }`}
                  >
                    <span className="uppercase font-bold tracking-wide">
                      {button.label}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-dark-800 text-xs uppercase text-[#2277B4] dark:text-blue-400 border-b border-zinc-100 dark:border-dark-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => (
                    <th
                      key={header.id}
                      className={`p-4 ${idx === 0 ? "rounded-tl-lg" : ""} ${
                        idx === headerGroup.headers.length - 1 ? "rounded-tr-lg" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                      }}
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
            <tbody className="divide-y divide-zinc-100 dark:divide-dark-700 text-sm bg-white dark:bg-dark-900">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    Cargando pólizas...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium">No se encontraron servicios o pólizas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
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

        {!loading && filteredGroups.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-900 flex items-center justify-between gap-3">
            <label className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
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
                className="px-2 py-1 rounded-md border border-zinc-200 dark:border-dark-700 text-sm text-zinc-700 dark:text-zinc-100 bg-zinc-50 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Portals */}
      <AssignPolicyModal
        isOpen={assignModalOpen}
        onClose={closeAssignModal}
        target={assignTarget}
        onAssigned={load}
      />

      <EditPolicyModal
        isOpen={Boolean(editingRow && !String(editingRow.id).startsWith("product-"))}
        editingRow={editingRow}
        onClose={() => setEditingRow(null)}
        onSaved={load}
      />

      <PolicyFilterPicker
        isOpen={Boolean(activeFilterPickerField && showFilters)}
        policies={policies}
        activeField={activeFilterPickerField}
        filters={filters}
        onClose={closeFilterPicker}
        onApply={applyFilterValue}
      />

      {viewingFoliosGroup &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
            onClick={() => setViewingFoliosGroup(null)}
          >
            <div
              className="bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-dark-800 bg-[#1a2b4c] dark:bg-dark-800 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                    Folios Registrados
                  </h3>
                  <p className="text-[10px] text-zinc-300 dark:text-zinc-400 mt-0.5">
                    {viewingFoliosGroup.product?.name}
                  </p>
                </div>
                <button
                  onClick={() => setViewingFoliosGroup(null)}
                  className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Selecciona un folio para mostrarlo en la tabla principal.
                  </p>
                  {selectedFoliosByGroup[viewingFoliosGroup.id] && (
                    <button
                      onClick={() => {
                        setSelectedFoliosByGroup((prev) => {
                          const next = { ...prev };
                          delete next[viewingFoliosGroup.id];
                          return next;
                        });
                        setViewingFoliosGroup(null);
                      }}
                      className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:underline"
                    >
                      Mostrar grupo
                    </button>
                  )}
                </div>
                <LicenseTable
                  items={viewingFoliosGroup.items || []}
                  selectedId={selectedFoliosByGroup[viewingFoliosGroup.id]}
                  onSelect={(item) => {
                    setSelectedFoliosByGroup((prev) => ({
                      ...prev,
                      [viewingFoliosGroup.id]: item.id,
                    }));
                    setViewingFoliosGroup(null);
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
