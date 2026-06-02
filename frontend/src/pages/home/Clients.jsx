import React, { memo, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteClientApi,
  listClientsDynamicApi,
} from "../../actionsAPI/clients.api";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  FolderOpen,
  Plus,
  X,
  Search,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Lightbulb,
  SlidersHorizontal,
  Upload,
  FileSpreadsheet,
  FileText,
} from "@icons";

import { normalizeSearchText } from "../../utils/formatters";
import {
  exportRowsToExcel,
  exportTemplateToExcel,
} from "../../utils/excelExport";
import { notificationService } from "../../services/notificationService";

// Subcomponentes modularizados
import ClientCreateModal from "./clients/ClientCreateModal";
import ClientEditModal from "./clients/ClientEditModal";
import ClientBulkModal from "./clients/ClientBulkModal";
import ClientFilterPicker from "./clients/ClientFilterPicker";

const EXCEL_VIEW_STORAGE_KEY = "clients_excel_view_config";
const DEFAULT_VISIBLE_CLIENT_COLUMNS = [
  "business_name",
  "rfc",
  "email1",
  "celular",
];
const FIXED_MAIN_COLUMNS_COUNT = 4;
const QUICK_FILTER_FIELDS = [
  {
    id: "business_name",
    aliases: ["business_name", "razon_social"],
    buttonLabel: "razon social",
  },
  {
    id: "codigo_postal",
    aliases: ["codigo_postal", "cp", "postal_code"],
    buttonLabel: "codigo postal",
  },
  {
    id: "ciudad",
    aliases: ["ciudad", "city"],
    buttonLabel: "ciudad",
  },
];

const CLIENT_TEMPLATE_COLUMNS = [
  "RAZÓN SOCIAL",
  "RFC",
  "CORREO PRINCIPAL",
  "CELULAR",
  "CIUDAD",
  "TELÉFONO",
  "CORREO SECUNDARIO",
  "CÓDIGO POSTAL",
];

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function scoreColumnAffinity(detailColumn, primaryColumn) {
  const tokensDetail = String(detailColumn?.name || "")
    .toLowerCase()
    .split(/[_\s]+/);
  const tokensPrimary = String(primaryColumn?.name || "")
    .toLowerCase()
    .split(/[_\s]+/);
  return tokensDetail.filter((t) => tokensPrimary.includes(t)).length;
}

function resolveDetailHostColumn(
  detailColumn,
  primaryColumns = [],
  detailColumnsByPrimary = {}
) {
  if (!primaryColumns.length) return null;

  let bestColumn = primaryColumns[0];
  let bestScore = -1;
  let bestLoad = Number.POSITIVE_INFINITY;

  primaryColumns.forEach((primaryColumn) => {
    const score = scoreColumnAffinity(detailColumn, primaryColumn);
    const load = (detailColumnsByPrimary[primaryColumn.name] || []).length;

    if (score > bestScore || (score === bestScore && load < bestLoad)) {
      bestColumn = primaryColumn;
      bestScore = score;
      bestLoad = load;
    }
  });

  return bestColumn?.name || primaryColumns[0]?.name || null;
}

function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Columnas personalizadas / Excel view
  const [columnLabelOverrides, setColumnLabelOverrides] = useState({});
  const [excelViewColumns, setExcelViewColumns] = useState(null);

  // Filter Picker States
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const [filterPickerPage, setFilterPickerPage] = useState(0);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await listClientsDynamicApi();
      const nextColumns = data.columns || [];
      const nextRows = data.rows || [];

      setDynamicColumns(nextColumns);
      setClients(nextRows);
      setAllClients(nextRows);

      const hasSavedViewConfig = !!localStorage.getItem(EXCEL_VIEW_STORAGE_KEY);
      if (
        !hasSavedViewConfig &&
        Array.isArray(data.viewColumns) &&
        data.viewColumns.length
      ) {
        setExcelViewColumns(data.viewColumns);
      }
    } catch (e) {
      setError(e.message || "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXCEL_VIEW_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (parsed?.columnLabelOverrides) {
        setColumnLabelOverrides(parsed.columnLabelOverrides);
      }
      if (Array.isArray(parsed?.excelViewColumns)) {
        setExcelViewColumns(parsed.excelViewColumns);
      }
    } catch {
      localStorage.removeItem(EXCEL_VIEW_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!showFilters) {
      setActiveFilterPickerField(null);
      setFilterPickerSearch("");
    }
  }, [showFilters]);

  // Filtrado reactivo en el frontend
  useEffect(() => {
    const normalizedQuery = normalizeSearchText(q);
    const activeFilters = Object.entries(filters).filter(
      ([, value]) => String(value || "").trim() !== ""
    );
    const hasFilters = activeFilters.length > 0;

    if (!normalizedQuery && !hasFilters) {
      setClients(allClients);
      return;
    }

    const searchableColumns =
      filterableColumns.length ? filterableColumns : tableColumnsFromView;

    const filtered = allClients.filter((client) => {
      const globalMatch =
        !normalizedQuery ||
        searchableColumns.some((column) =>
          normalizeSearchText(client[column.name]).includes(normalizedQuery)
        );

      const fieldFiltersMatch = activeFilters.every(
        ([key, value]) =>
          normalizeSearchText(client[key]) === normalizeSearchText(value)
      );

      return globalMatch && fieldFiltersMatch;
    });

    setClients(filtered);
  }, [q, filters, allClients]);

  const filterableColumns = useMemo(
    () =>
      dynamicColumns.filter(
        (column) => column.name && column.name !== "portal_password_hash"
      ),
    [dynamicColumns]
  );

  const quickFilterButtons = useMemo(() => {
    const availableColumns = new Set(
      filterableColumns.map((column) => column.name)
    );
    const columnsByName = new Map(
      filterableColumns.map((column) => [column.name, column])
    );

    return QUICK_FILTER_FIELDS.map((config) => {
      const resolvedFieldName =
        config.aliases.find((name) => availableColumns.has(name)) || config.id;
      const column = columnsByName.get(resolvedFieldName);

      return {
        ...config,
        fieldName: resolvedFieldName,
        modalLabel:
          columnLabelOverrides[resolvedFieldName] ||
          column?.label ||
          config.buttonLabel,
      };
    });
  }, [filterableColumns, columnLabelOverrides]);

  const activeFilterPickerConfig = useMemo(
    () =>
      quickFilterButtons.find(
        (button) => button.fieldName === activeFilterPickerField
      ) || null,
    [quickFilterButtons, activeFilterPickerField]
  );

  const filterPickerOptions = useMemo(() => {
    if (!activeFilterPickerField) return [];

    const uniqueValues = new Map();
    allClients.forEach((client) => {
      const rawValue = client?.[activeFilterPickerField];
      if (!hasValue(rawValue)) return;

      const value = String(rawValue).trim();
      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;

      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [allClients, activeFilterPickerField]);

  const visibleFilterPickerOptions = useMemo(() => {
    const normalizedPickerSearch = normalizeSearchText(filterPickerSearch);
    if (!normalizedPickerSearch) return filterPickerOptions;

    return filterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(normalizedPickerSearch)
    );
  }, [filterPickerSearch, filterPickerOptions]);

  const fixedMainColumnNames = useMemo(() => {
    if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
      const excelOrdered = excelViewColumns.filter(
        (name, index, arr) =>
          !!name &&
          name !== "portal_password_hash" &&
          arr.indexOf(name) === index
      );
      if (excelOrdered.length) {
        return excelOrdered.slice(0, FIXED_MAIN_COLUMNS_COUNT);
      }
    }

    return DEFAULT_VISIBLE_CLIENT_COLUMNS.slice(0, FIXED_MAIN_COLUMNS_COUNT);
  }, [excelViewColumns]);

  const tableColumnsFromView = useMemo(() => {
    let nextColumns = filterableColumns;

    if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
      const columnsByName = new Map(
        filterableColumns.map((column) => [column.name, column])
      );
      const fixedColumns = fixedMainColumnNames
        .map((columnName) => columnsByName.get(columnName))
        .filter(Boolean);
      const fixedColumnsSet = new Set(
        fixedColumns.map((column) => column.name)
      );

      const excelSubset = excelViewColumns
        .map((columnName) => columnsByName.get(columnName))
        .filter((column) => !!column)
        .filter((column) => !fixedColumnsSet.has(column.name));

      const mergedColumns = [...fixedColumns, ...excelSubset];
      if (mergedColumns.length) nextColumns = mergedColumns;
    }

    return nextColumns.map((column) => ({
      ...column,
      label: columnLabelOverrides[column.name] || column.label,
    }));
  }, [
    filterableColumns,
    excelViewColumns,
    columnLabelOverrides,
    fixedMainColumnNames,
  ]);

  const primaryTableColumns = useMemo(() => {
    const columnsByName = new Map(
      tableColumnsFromView.map((column) => [column.name, column])
    );

    let orderedColumns = fixedMainColumnNames
      .map((columnName) => columnsByName.get(columnName))
      .filter(Boolean);

    if (orderedColumns.length < FIXED_MAIN_COLUMNS_COUNT) {
      const orderedSet = new Set(orderedColumns.map((column) => column.name));
      const needed = FIXED_MAIN_COLUMNS_COUNT - orderedColumns.length;
      const fallbackColumns = tableColumnsFromView
        .filter((column) => !orderedSet.has(column.name))
        .slice(0, needed);

      orderedColumns = [...orderedColumns, ...fallbackColumns];
    }

    return orderedColumns.slice(0, FIXED_MAIN_COLUMNS_COUNT);
  }, [tableColumnsFromView, fixedMainColumnNames]);

  const detailColumns = useMemo(() => {
    const primarySet = new Set(
      primaryTableColumns.map((column) => column.name)
    );
    return tableColumnsFromView.filter(
      (column) => !primarySet.has(column.name)
    );
  }, [tableColumnsFromView, primaryTableColumns]);

  const clearFilters = () => {
    setQ("");
    setFilters({});
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => String(v || "").trim() !== "").length +
    (q.trim() ? 1 : 0);

  const getRowDetailColumns = (row) =>
    detailColumns.filter((column) => hasValue(row?.[column.name]));

  const remove = async (id) => {
    const isConfirmed = await notificationService.confirm({
      title: "¿Estás seguro?",
      text: "Se eliminarán también sus cotizaciones y contactos.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return;

    try {
      await deleteClientApi(id);
      await load();
      notificationService.toast({ title: "El cliente ha sido eliminado", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e.message || "Error eliminando cliente");
    }
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  // Callback del importador masivo
  const handleBulkSuccess = (data) => {
    if (data.type === "drive" && data.report) {
      const report = data.report;
      const mappedHeadersByColumn = report.mappedHeadersByColumn || {};
      const preferredViewColumns =
        (Array.isArray(report.preferredViewColumns) && report.preferredViewColumns.length)
          ? report.preferredViewColumns
          : Object.keys(mappedHeadersByColumn);

      if (preferredViewColumns.length) {
        setExcelViewColumns(preferredViewColumns);
        setColumnLabelOverrides((prev) => {
          const nextOverrides = {
            ...prev,
            ...mappedHeadersByColumn,
          };
          localStorage.setItem(
            EXCEL_VIEW_STORAGE_KEY,
            JSON.stringify({
              columnLabelOverrides: nextOverrides,
              excelViewColumns: preferredViewColumns,
            })
          );
          return nextOverrides;
        });
      }
    }
    load();
  };

  // Columnas para TanStack Table
  const columns = useMemo(() => {
    const dynamicDataColumns = primaryTableColumns.map((column) => ({
      accessorKey: column.name,
      header: column.label,
      size: column.name === "business_name" ? 240 : 180,
      cell: ({ getValue }) => {
        const rawValue = getValue();
        const value =
          rawValue === null || rawValue === undefined || rawValue === ""
            ? "—"
            : String(rawValue);

        if (column.name === "business_name") {
          const normalizedBusinessName =
            value !== "—"
              ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
              : value;
          const firstChar =
            normalizedBusinessName !== "—"
              ? normalizedBusinessName.charAt(0)
              : "•";

          return (
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-9 rounded-full shrink-0 flex items-center justify-center border border-zinc-200 bg-zinc-100 text-zinc-900 font-bold text-sm shadow-sm">
                {firstChar}
              </div>
              <span
                className="font-medium text-zinc-800 leading-snug min-w-0"
                style={{
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {normalizedBusinessName}
              </span>
            </div>
          );
        }

        return (
          <span
            className="block w-full text-zinc-600 text-sm leading-snug"
            style={{
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {value}
          </span>
        );
      },
    }));

    return [
      {
        id: "expander",
        header: () => (
          <button
            onClick={() => setShowModal(true)}
            title="Registrar nuevo cliente"
          >
            <span className="inline-flex items-center gap-1 text-[#000] no-underline text-sm font-bold">
              <Plus size={18} strokeWidth={3} />
              <span>Nuevo</span>
            </span>
          </button>
        ),
        cell: ({ row }) => {
          const detailCount = getRowDetailColumns(row.original).length;
          if (!detailCount) return null;

          const clientId = row.original.id;
          const isOpen = !!expandedRows[clientId];

          return (
            <button
              onClick={() =>
                setExpandedRows((prev) => ({
                  ...prev,
                  [clientId]: !prev[clientId],
                }))
              }
              className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"
              title={isOpen ? "Ocultar más detalles" : "Ver más detalles"}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          );
        },
        enableSorting: false,
        size: 90,
      },
      ...dynamicDataColumns,
      {
        id: "actions",
        header: "Acciones",
        size: 180,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Link to={`/clientes/${row.original.id}`}>
              <button
                className="px-4 py-1.5 text-sm font-semibold text-[#2277B4] bg-white rounded-xl
                           border border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#B8C6D8]
                           shadow-sm transition-colors duration-150"
              >
                Gestionar
              </button>
            </Link>
            {(user?.role?.name === "ADMIN" ||
              user?.role?.name === "VENTAS") && (
              <>
                <button
                  onClick={() => openEditModal(row.original)}
                  className="size-8 flex items-center justify-center rounded-lg text-amber-800 hover:scale-75 transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => remove(row.original.id)}
                  className="size-8 flex items-center justify-center rounded-lg text-red-700 hover:scale-75 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ),
      },
    ];
  }, [primaryTableColumns, user?.role?.name, detailColumns, expandedRows]);

  const tableData = useMemo(() => {
    if (!excelViewColumns?.length) return clients;

    const hasExcelValue = (row) =>
      excelViewColumns.some((columnName) => {
        const value = row?.[columnName];
        return value !== null && value !== undefined && String(value).trim() !== "";
      });

    const withIndex = clients.map((row, index) => ({
      row,
      index,
      hasExcel: hasExcelValue(row),
    }));

    withIndex.sort((a, b) => {
      if (a.hasExcel !== b.hasExcel) return a.hasExcel ? -1 : 1;

      const aId = Number(a.row?.id || 0);
      const bId = Number(b.row?.id || 0);
      if (aId !== bId) return bId - aId;

      return a.index - b.index;
    });

    return withIndex.map((item) => item.row);
  }, [clients, excelViewColumns]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const isTableScrollable = table.getState().pagination.pageSize >= 25;

  const getExportContext = () => {
    const usedLabels = new Set();
    const exportColumns = tableColumnsFromView.map((column) => {
      const baseLabel = String(column.label || column.name || "").trim();
      const fallbackLabel = String(column.name || "").trim();
      const base = baseLabel || fallbackLabel || "Columna";
      let label = base;
      const normalized = base.toLowerCase();

      if (usedLabels.has(normalized)) {
        label = `${base} (${fallbackLabel || normalized})`;
      }

      usedLabels.add(normalized);

      return {
        name: column.name,
        label,
      };
    });

    const exportRows = table
      .getSortedRowModel()
      .rows.map((row) => row.original);

    return {
      exportColumns,
      exportRows,
    };
  };

  const handleExportPDF = async () => {
    const { exportColumns, exportRows } = getExportContext();

    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay clientes para exportar.");
      return;
    }

    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(16);
      doc.setTextColor(26, 43, 76);
      doc.text("Clientes", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);

      autoTable(doc, {
        startY: 28,
        head: [exportColumns.map((column) => column.label.toUpperCase())],
        body: exportRows.map((row) =>
          exportColumns.map((column) => {
            const rawValue = row?.[column.name];
            return hasValue(rawValue) ? String(rawValue) : "—";
          })
        ),
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      doc.save(`Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el PDF.");
    }
  };

  const handleExportExcel = async () => {
    const { exportColumns, exportRows } = getExportContext();

    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay clientes para exportar.");
      return;
    }

    try {
      const rows = exportRows.map((row) => {
        const nextRow = {};

        exportColumns.forEach((column) => {
          const rawValue = row?.[column.name];
          nextRow[column.label] = hasValue(rawValue) ? rawValue : "";
        });

        return nextRow;
      });

      await exportRowsToExcel({
        rows,
        sheetName: "Clientes",
        fileName: `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el Excel.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await exportTemplateToExcel({
        columns: CLIENT_TEMPLATE_COLUMNS,
        sheetName: "Plantilla Clientes",
        fileName: "Plantilla_Clientes.xlsx",
        widths: [34, 18, 30, 18, 20, 30, 18, 18],
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar la plantilla de Excel.");
    }
  };

  const applyFilterValue = (field, val) => {
    setFilters((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800">
            Clientes Registrados
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Gestiones y permisos al portal del cliente
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Tabla con TanStack */}
      <div className="glass-panel rounded-md border overflow-hidden">
        {/* Toolbar de la tabla */}
        <div className="px-4 py-3 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-600">
              Total clientes ({clients.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Búsqueda global */}
            <div className="flex gap-1 bg-white p-1 rounded-lg border border-zinc-200">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cliente…"
                title="Busca por todos los campos. Ignora acentos, mayusculas y caracteres especiales."
                className="bg-transparent border-none text-sm text-zinc-800 placeholder:text-zinc-400 px-3 w-40 md:w-52 focus:outline-none"
              />
              <div className="px-3 py-1.5 text-black">
                <Search size={16} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
                title="Exportar a PDF"
              >
                <FileText size={14} /> Exportar a PDF
              </button>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                title="Exportar a Excel"
              >
                <FileSpreadsheet size={14} /> Exportar a Excel
              </button>
            </div>

            {/* Botón filtros */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#2277B4] text-white border-[#2277B4]"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white text-[#2277B4] rounded-full text-xs font-bold size-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Botón carga masiva */}
            {(user?.role?.name === "ADMIN" ||
              user?.role?.name === "VENTAS") && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1a2b4c] transition-colors"
              >
                <Upload size={15} />
                Cargar clientes
              </button>
            )}

            {/* Limpiar filtros */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                <X size={14} /> Limpiar
              </button>
            )}

            <span className="text-xs text-zinc-400 hidden md:inline">
              Pág. {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount() || 1}
            </span>
          </div>
        </div>

        {detailColumns.length > 0 && (
          <div className="px-4 py-2 min-h-10 bg-blue-50 border-b border-blue-100 text-xs text-[#2277B4] flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 shrink-0">
              <Lightbulb size={14} className="inline" /> Clic en{" "}
              <ChevronRight size={12} className="inline" /> para más detalles
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 transition-opacity duration-150 ${
                  showFilters ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {quickFilterButtons.map((button) => {
                  const selectedValue = String(filters[button.fieldName] || "");
                  return (
                    <button
                      key={button.id}
                      onClick={() => setActiveFilterPickerField(button.fieldName)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs border transition-colors whitespace-nowrap ${
                        selectedValue
                          ? "bg-[#2277B4] text-white border-[#2277B4]"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="uppercase font-bold tracking-wide">
                        {button.buttonLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-white transition-colors whitespace-nowrap"
                title="Descargar plantilla de carga masiva"
              >
                <FileSpreadsheet size={13} /> Descargar plantilla excel
              </button>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div
          className={`overflow-x-auto ${
            isTableScrollable ? "max-h-[65vh] overflow-y-auto" : ""
          }`}
        >
          <table className="w-full table-fixed">
            <thead
              className={`bg-zinc-50 border-b border-zinc-100 ${
                isTableScrollable ? "sticky top-0 z-20" : ""
              }`}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`${
                        header.column.id === "expander" ? "glass-flash " : ""
                      }px-4 py-3 text-left text-xs font-semibold text-[#2277B4] uppercase tracking-wider transition-colors ${
                        header.column.getCanSort()
                          ? "cursor-pointer hover:bg-zinc-100"
                          : "cursor-default"
                      }`}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp size={14} />,
                          desc: <ChevronDown size={14} />,
                        }[header.column.getIsSorted()] ?? ""}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const rowDetailColumns = getRowDetailColumns(row.original);
                  const isExpanded = !!expandedRows[row.original.id];
                  const detailColumnsByPrimary = primaryTableColumns.reduce(
                    (acc, primaryColumn) => {
                      acc[primaryColumn.name] = [];
                      return acc;
                    },
                    {}
                  );

                  rowDetailColumns.forEach((column) => {
                    const hostColumn =
                      resolveDetailHostColumn(
                        column,
                        primaryTableColumns,
                        detailColumnsByPrimary
                      ) || primaryTableColumns[0]?.name;

                    if (hostColumn && detailColumnsByPrimary[hostColumn]) {
                      detailColumnsByPrimary[hostColumn].push(column);
                    }
                  });

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 text-sm align-top"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>

                      {isExpanded && rowDetailColumns.length > 0 && (
                        <tr className="bg-zinc-50/80 dark:bg-dark-800/80">
                          {row.getVisibleCells().map((cell) => {
                            const columnId = cell.column.id;
                            const alignedDetails =
                              detailColumnsByPrimary[columnId] || [];

                            return (
                              <td
                                key={`${cell.id}__detail`}
                                className="px-4 py-4 align-top"
                              >
                                {alignedDetails.length > 0 && (
                                  <div className="space-y-3">
                                    {alignedDetails.map((column) => {
                                      const rawValue =
                                        row.original?.[column.name];
                                      const value = hasValue(rawValue)
                                        ? String(rawValue)
                                        : "—";

                                      return (
                                        <div
                                          key={`${row.id}_${column.name}`}
                                          className="min-w-0"
                                        >
                                          <p className="text-[10px] font-semibold uppercase text-[#2277B4] dark:text-blue-400 tracking-wider">
                                            {column.label}
                                          </p>
                                          <p className="text-sm text-zinc-700 dark:text-zinc-100 break-words">
                                            {value}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex justify-center mb-3 opacity-50">
                      <FolderOpen size={36} />
                    </div>
                    <p className="text-zinc-500">
                      {loading ? "Cargando clientes..." : "No se encontraron clientes"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {clients.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Mostrar</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">por página</span>
            </div>

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

      {/* Modal para Crear Cliente */}
      <ClientCreateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          load();
        }}
      />

      {/* Modal para Editar Cliente */}
      <ClientEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingClient(null);
          load();
        }}
      />

      {/* Modal para Carga Masiva */}
      <ClientBulkModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={handleBulkSuccess}
      />

      {/* Selector de Filtros */}
      <ClientFilterPicker
        isOpen={!!activeFilterPickerField && showFilters}
        onClose={() => setActiveFilterPickerField(null)}
        fieldName={activeFilterPickerField}
        fieldConfig={activeFilterPickerConfig}
        filters={filters}
        options={visibleFilterPickerOptions}
        filterPickerSearch={filterPickerSearch}
        setFilterPickerSearch={setFilterPickerSearch}
        filterPickerPage={filterPickerPage}
        setFilterPickerPage={setFilterPickerPage}
        onApplyFilter={applyFilterValue}
      />
    </div>
  );
}

export default memo(Clients);
