import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import Card from "../../../components/ui/Card";
import { listClientActiveServicesApi } from "../../../actionsAPI/clients.api";
import { deleteContactProductApi } from "../../../actionsAPI/contacts.api";
import {
  Trash2,
  FileText,
  X,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
} from "@icons";
import { normalizeSearchText } from "./utils";
import { notificationService } from "../../../services/notificationService";
import { logger } from "../../../services/logger";

const STATUS_LABELS = {
  ACTIVE: "ACTIVO",
  CANCELLED: "INACTIVO",
  EXPIRING_SOON: "Por vencer",
  EXPIRED: "EXPIRADO",
};

const STATUS_STYLES = {
  ACTIVE: "text-[#1B4733] bg-[#E2F0D9]",
  CANCELLED: "text-zinc-600 bg-zinc-100",
  EXPIRING_SOON: "text-amber-700 bg-amber-100",
  EXPIRED: "text-red-700 bg-red-100",
};

const POLICIES_COLUMNS = [
  {
    accessorKey: "product_name",
    header: "Póliza o servicio",
    cell: ({ getValue }) => (
      <span className="font-medium text-light-text-primary hover:text-[#2277B4]">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: "contact_name",
    header: "Contacto Asignado",
    cell: ({ getValue }) => (
      <span className="text-light-text-secondary">{getValue() || "—"}</span>
    ),
  },
  {
    accessorKey: "license_key",
    header: "Folio",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-light-text-secondary">
        {getValue() || "—"}
      </span>
    ),
  },
  {
    accessorKey: "expiration_date",
    header: "Vence",
    cell: ({ getValue }) => (
      <span className="text-light-text-secondary">
        {getValue() ? new Date(getValue()).toLocaleDateString() : "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ getValue }) => {
      const v = getValue();
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            STATUS_STYLES[v] || "bg-zinc-100 text-zinc-600"
          }`}>
          {STATUS_LABELS[v] || v}
        </span>
      );
    },
    filterFn: (row, columnId, filterValue) =>
      !filterValue ||
      row.getValue(columnId)?.toLowerCase().includes(filterValue.toLowerCase()),
  },
];

export const ClientPoliciesTab = ({ clientId }) => {
  const [services, setServices] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    license_key: "",
  });
  const [activePolicyFilterPickerField, setActivePolicyFilterPickerField] =
    useState(null);
  const [policyFilterPickerSearch, setPolicyFilterPickerSearch] = useState("");

  const loadServices = () => {
    listClientActiveServicesApi(clientId)
      .then((data) =>
        setServices(
          data.map((s) => ({
            ...s,
            product_name: s.product?.name || "",
          })),
        ),
      )
      .catch((e) => {
        logger.error("Error loading policies", e);
      });
  };

  useEffect(() => {
    if (clientId) {
      loadServices();
    }
  }, [clientId]);

  const handleDeleteService = async (service) => {
    const confirmed = await notificationService.confirm({
      title: "¿Eliminar póliza o servicio?",
      text: "Esta acción desasignará el registro del cliente de manera permanente.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingServiceId(service.id);
      await deleteContactProductApi(service.id);
      notificationService.success("Eliminado", "La póliza o servicio fue desasignado correctamente.");
      loadServices();
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo eliminar el registro.");
    } finally {
      setDeletingServiceId(null);
    }
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim() !== "",
  ).length;
  const canClearFilters = activeFilterCount > 0 || globalFilter.trim() !== "";

  const policyFilterFieldLabels = {
    status: "Estado",
    license_key: "Folio",
  };

  const openPolicyFilterPicker = (fieldName) => {
    setActivePolicyFilterPickerField(fieldName);
    setPolicyFilterPickerSearch("");
  };

  const closePolicyFilterPicker = () => {
    setActivePolicyFilterPickerField(null);
    setPolicyFilterPickerSearch("");
  };

  const applyPolicyFilterValue = (value) => {
    if (!activePolicyFilterPickerField) return;

    setFilters((prev) => ({
      ...prev,
      [activePolicyFilterPickerField]: value,
    }));
    closePolicyFilterPicker();
  };

  useEffect(() => {
    if (!showFilters) {
      closePolicyFilterPicker();
    }
  }, [showFilters]);

  const policyFilterPickerOptions = useMemo(() => {
    if (!activePolicyFilterPickerField) return [];

    const uniqueValues = new Map();

    services.forEach((service) => {
      let value = "";

      if (activePolicyFilterPickerField === "license_key") {
        value = service.license_key || "";
      } else if (activePolicyFilterPickerField === "status") {
        value = STATUS_LABELS[service.status] || service.status || "";
      }

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;
      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [services, activePolicyFilterPickerField]);

  const visiblePolicyFilterPickerOptions = useMemo(() => {
    const s = normalizeSearchText(policyFilterPickerSearch);
    if (!s) return policyFilterPickerOptions;

    return policyFilterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(s),
    );
  }, [policyFilterPickerSearch, policyFilterPickerOptions]);

  const filteredServices = useMemo(() => {
    const s = normalizeSearchText(globalFilter);
    const hasFieldFilters = Object.values(filters).some((v) => v.trim() !== "");

    if (!s && !hasFieldFilters) return services;

    return services.filter((service) => {
      const statusLabel = STATUS_LABELS[service.status] || service.status || "";
      const expirationDate =
        service.expiration_date ?
          new Date(service.expiration_date).toLocaleDateString("es-MX")
        : "";

      const haystack = normalizeSearchText(
        [
          service.product_name,
          service.contact_name,
          service.license_key,
          service.status,
          statusLabel,
          expirationDate,
        ].join(" "),
      );

      const matchGlobal = !s || haystack.includes(s);

      const matchFilters =
        (!filters.license_key ||
          normalizeSearchText(service.license_key).includes(
            normalizeSearchText(filters.license_key),
          )) &&
        (!filters.status ||
          normalizeSearchText(statusLabel) ===
            normalizeSearchText(filters.status));

      return matchGlobal && matchFilters;
    });
  }, [services, globalFilter, filters]);

  const clearFilters = () => {
    setGlobalFilter("");
    setFilters({
      status: "",
      license_key: "",
    });
    closePolicyFilterPicker();
  };

  const policyColumns = [
    ...POLICIES_COLUMNS,
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const service = row.original;
        const isDeleting = deletingServiceId === service.id;

        return (
          <button
            onClick={() => handleDeleteService(service)}
            disabled={isDeleting}
            className="inline-flex items-center justify-center size-8 text-red-700 transition-transform duration-150 hover:scale-75 disabled:opacity-60 disabled:cursor-not-allowed"
            title={isDeleting ? "Eliminando…" : "Eliminar póliza o servicio"}>
            <Trash2 size={13} className={isDeleting ? "animate-pulse" : ""} />
          </button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredServices,
    columns: policyColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = filteredServices.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h3 className="font-semibold text-light-text-primary flex items-center gap-2 flex-1">
          <FileText size={18} /> Pólizas y Servicios
          {totalRows !== services.length && (
            <span className="ml-2 text-xs font-normal text-light-text-secondary">
              ({totalRows} de {services.length})
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2 min-h-[32px]">
          {canClearFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-100 hover:bg-red-50 transition-colors"
              title="Limpiar filtros">
              <X size={14} /> Limpiar
            </button>
          )}

          {[
            { id: "status", label: "ESTADO" },
            { id: "license_key", label: "FOLIO" },
          ].map((button) => {
            const selectedValue = String(filters[button.id] || "");

            return (
              <button
                key={button.id}
                onClick={() => openPolicyFilterPicker(button.id)}
                tabIndex={showFilters ? 0 : -1}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-all whitespace-nowrap ${
                  selectedValue ?
                    "bg-[#2277B4] text-white border-[#2277B4]"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                } ${
                  showFilters ?
                    "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-1 pointer-events-none"
                }`}>
                <span className="uppercase font-bold tracking-wide">
                  {button.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador global */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary"
            />
            <input
              type="text"
              placeholder="Buscar…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-sm rounded-lg border border-light-border bg-white focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-44 text-black"
            />
          </div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              showFilters || activeFilterCount > 0 ?
                "bg-[#2277B4] text-white border-[#2277B4]"
              : "bg-white text-light-text-secondary border-light-border hover:bg-zinc-50"
            }`}>
            <Filter size={13} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-[#2277B4] rounded-full px-1.5 py-0 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="text-xs text-light-text-secondary whitespace-nowrap">
            Pág. {pageIndex + 1} de {table.getPageCount() || 1}
          </span>
        </div>
      </div>

      {activePolicyFilterPickerField &&
        showFilters &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
            onClick={closePolicyFilterPicker}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base uppercase">
                    FILTRAR POR{" "}
                    {policyFilterFieldLabels[activePolicyFilterPickerField]}
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Selecciona o busca un valor para filtrar 
                  </p>
                </div>
                <button
                  onClick={closePolicyFilterPicker}
                  className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                  <Search size={15} className="text-zinc-500" />
                  <input
                    value={policyFilterPickerSearch}
                    onChange={(e) =>
                      setPolicyFilterPickerSearch(e.target.value)
                    }
                    placeholder="Buscar valor…"
                    className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                  {visiblePolicyFilterPickerOptions.length > 0 ?
                    visiblePolicyFilterPickerOptions.map((value) => {
                      const isSelected =
                        normalizeSearchText(
                          filters[activePolicyFilterPickerField],
                        ) === normalizeSearchText(value);

                      return (
                        <button
                          key={`${activePolicyFilterPickerField}_${value}`}
                          onClick={() => applyPolicyFilterValue(value)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            isSelected ?
                              "bg-[#2277B4]/10 text-[#125280] font-semibold"
                            : "text-zinc-700 hover:bg-zinc-50"
                          }`}>
                          {value}
                        </button>
                      );
                    })
                  : <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                      No hay valores para mostrar.
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-light-text-secondary uppercase bg-[#F2F5F9]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header, i) => {
                  const canSort = header.column.getCanSort();

                  return (
                    <th
                      key={header.id}
                      onClick={
                        canSort ?
                          header.column.getToggleSortingHandler()
                        : undefined
                      }
                      className={`px-4 py-3 select-none whitespace-nowrap transition-colors text-[#2277B4] ${
                        canSort ? "cursor-pointer hover:bg-[#e8edf3]" : ""
                      } ${i === 0 ? "rounded-l-lg" : ""} ${
                        i === hg.headers.length - 1 ? "rounded-r-lg" : ""
                      }`}>
                      <span className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && header.column.getIsSorted() === "asc" && (
                          <ChevronUp size={12} />
                        )}
                        {canSort && header.column.getIsSorted() === "desc" && (
                          <ChevronDown size={12} />
                        )}
                        {canSort && !header.column.getIsSorted() && (
                          <span className="opacity-30 text-[10px]">⇅</span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-light-border">
            {table.getRowModel().rows.length > 0 ?
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
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
                  colSpan={policyColumns.length}
                  className="text-center py-10 text-light-text-secondary text-sm">
                  {services.length === 0 ?
                    "No hay servicios activos."
                  : "Sin resultados para los filtros aplicados."}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between pt-4 border-t border-light-border mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-light-text-secondary">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="text-xs border border-light-border rounded px-2 py-1 bg-white text-black">
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline">
            {from}–{to} de {totalRows} registros
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            ««
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Siguiente
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            »»
          </button>
        </div>
      </div>
    </Card>
  );
};
