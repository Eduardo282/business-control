import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import {
  createClientApi,
  deleteClientApi,
  updateClientApi,
  bulkCreateClientsApi,
  listClientsDynamicApi,
  importClientsFromDriveApi,
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
  CheckCircle2,
  AlertCircle,
} from "@icons";

import Input from "../../components/ui/Input";

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

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizeColumnTerms(value) {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(" ")
        .map((token) => token.replace(/[0-9]+/g, ""))
        .filter((token) => token.length > 1),
    ),
  );
}

function scoreColumnAffinity(detailColumn, primaryColumn) {
  const detailTokens = tokenizeColumnTerms(
    `${detailColumn?.name || ""} ${detailColumn?.label || ""}`,
  );
  if (!detailTokens.length) return 0;

  const primaryTokens = new Set(
    tokenizeColumnTerms(
      `${primaryColumn?.name || ""} ${primaryColumn?.label || ""}`,
    ),
  );

  return detailTokens.reduce(
    (score, token) => (primaryTokens.has(token) ? score + 1 : score),
    0,
  );
}

function resolveDetailHostColumn(
  detailColumn,
  primaryColumns = [],
  detailColumnsByPrimary = {},
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

export default function Clients() {
  const { user } = useContext(AuthContext);
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
  const [showModal, setShowModal] = useState(false);

  // Formulario de creación/edición
  const [business_name, setBusinessName] = useState("");
  const [rfc, setRfc] = useState("");
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [celular, setCelular] = useState("");
  const [telefono, setTelefono] = useState("");
  const [codigo_postal, setCodigoPostal] = useState("");
  const [ciudad, setCiudad] = useState("");

  // Estado para edición
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estado para carga masiva
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveImporting, setDriveImporting] = useState(false);
  const [columnLabelOverrides, setColumnLabelOverrides] = useState({});
  const [excelViewColumns, setExcelViewColumns] = useState(null);
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const bulkFileRef = useRef(null);

  // Mapeo de columnas Excel → campo DB
  const COLUMN_MAP = {
    "razon social": "business_name",
    "razón social": "business_name",
    business_name: "business_name",
    empresa: "business_name",
    nombre: "business_name",
    rfc: "rfc",
    "correo principal": "email1",
    email1: "email1",
    correo: "email1",
    email: "email1",
    "correo secundario": "email2",
    email2: "email2",
    celular: "celular",
    movil: "celular",
    móvil: "celular",
    telefono: "telefono",
    teléfono: "telefono",
    tel: "telefono",
    "codigo postal": "codigo_postal",
    "código postal": "codigo_postal",
    codigo_postal: "codigo_postal",
    cp: "codigo_postal",
    ciudad: "ciudad",
    city: "ciudad",
  };

  const handleBulkFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkResult(null);
    setBulkErrors([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!raw.length) {
          setBulkErrors(["El archivo está vacío o no tiene datos."]);
          return;
        }

        // Mapear columnas
        const mapped = raw.map((row, idx) => {
          const mapped_row = {};
          Object.entries(row).forEach(([key, val]) => {
            const normalised = key.trim().toLowerCase();
            const field = COLUMN_MAP[normalised];
            if (field) mapped_row[field] = String(val).trim();
          });
          mapped_row._row = idx + 2; // fila Excel (1=header)
          return mapped_row;
        });

        // Validar
        const errors = [];
        mapped.forEach((r) => {
          if (!r.business_name) {
            errors.push(`Fila ${r._row}: Falta "Razón Social" (obligatorio).`);
          }
        });

        const valid = mapped.filter((r) => r.business_name);
        setBulkData(valid);
        setBulkErrors(errors);
      } catch {
        setBulkErrors([
          "No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx / .xls).",
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset para poder seleccionar el mismo archivo otra vez
    e.target.value = "";
  };

  const executeBulkUpload = async () => {
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const inputs = bulkData.map(({ _row, ...rest }) => ({
        business_name: rest.business_name,
        rfc: rest.rfc || null,
        email1: rest.email1 || null,
        email2: rest.email2 || null,
        celular: rest.celular || null,
        telefono: rest.telefono || null,
        codigo_postal: rest.codigo_postal || null,
        ciudad: rest.ciudad || null,
      }));

      // Enviar en lotes de 200 para evitar error 413
      const CHUNK = 200;
      let totalCreated = 0;
      for (let i = 0; i < inputs.length; i += CHUNK) {
        const chunk = inputs.slice(i, i + CHUNK);
        const created = await bulkCreateClientsApi(chunk);
        totalCreated += created.length;
      }

      setBulkResult({ success: true, count: totalCreated });
      setBulkData([]);
      await load();
    } catch (err) {
      setBulkResult({
        success: false,
        message: err.message || "Error en la carga masiva.",
      });
    } finally {
      setBulkUploading(false);
    }
  };

  const executeDriveImport = async () => {
    const url = driveUrl.trim();
    if (!url) {
      setBulkResult({
        success: false,
        message: "Debes ingresar la URL del archivo en Google Drive.",
      });
      return;
    }

    setDriveImporting(true);
    setBulkResult(null);
    try {
      const report = await importClientsFromDriveApi(url);

      const mappedHeadersByColumn = report.mappedHeadersByColumn || {};
      const preferredViewColumns =
        (
          Array.isArray(report.preferredViewColumns) &&
          report.preferredViewColumns.length
        ) ?
          report.preferredViewColumns
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
            }),
          );

          return nextOverrides;
        });
      }

      setBulkResult({
        success: true,
        count: report.importedCount,
        skippedCount: report.skippedCount,
        details: report,
      });
      await load();
    } catch (err) {
      setBulkResult({
        success: false,
        message: err.message || "Error importando archivo desde Drive.",
      });
    } finally {
      setDriveImporting(false);
    }
  };

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

  const filterableColumns = useMemo(
    () =>
      dynamicColumns.filter(
        (column) => column.name && column.name !== "portal_password_hash",
      ),
    [dynamicColumns],
  );

  const quickFilterButtons = useMemo(() => {
    const availableColumns = new Set(
      filterableColumns.map((column) => column.name),
    );
    const columnsByName = new Map(
      filterableColumns.map((column) => [column.name, column]),
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
        (button) => button.fieldName === activeFilterPickerField,
      ) || null,
    [quickFilterButtons, activeFilterPickerField],
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
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [allClients, activeFilterPickerField]);

  const visibleFilterPickerOptions = useMemo(() => {
    const normalizedPickerSearch = normalizeSearchText(filterPickerSearch);
    if (!normalizedPickerSearch) return filterPickerOptions;

    return filterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(normalizedPickerSearch),
    );
  }, [filterPickerSearch, filterPickerOptions]);

  const fixedMainColumnNames = useMemo(() => {
    if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
      const excelOrdered = excelViewColumns.filter(
        (name, index, arr) =>
          !!name &&
          name !== "portal_password_hash" &&
          arr.indexOf(name) === index,
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
        filterableColumns.map((column) => [column.name, column]),
      );
      const fixedColumns = fixedMainColumnNames
        .map((columnName) => columnsByName.get(columnName))
        .filter(Boolean);
      const fixedColumnsSet = new Set(
        fixedColumns.map((column) => column.name),
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
      tableColumnsFromView.map((column) => [column.name, column]),
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
      primaryTableColumns.map((column) => column.name),
    );
    return tableColumnsFromView.filter(
      (column) => !primarySet.has(column.name),
    );
  }, [tableColumnsFromView, primaryTableColumns]);

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

  useEffect(() => {
    const normalizedQuery = normalizeSearchText(q);
    const activeFilters = Object.entries(filters).filter(
      ([, value]) => String(value || "").trim() !== "",
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
          normalizeSearchText(client[column.name]).includes(normalizedQuery),
        );

      const fieldFiltersMatch = activeFilters.every(
        ([key, value]) =>
          normalizeSearchText(client[key]) === normalizeSearchText(value),
      );

      return globalMatch && fieldFiltersMatch;
    });

    setClients(filtered);
  }, [q, filters, allClients, filterableColumns, tableColumnsFromView]);

  const openFilterPicker = (fieldName) => {
    setActiveFilterPickerField(fieldName);
    setFilterPickerSearch("");
  };

  const closeFilterPicker = () => {
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  };

  const applyFilterValue = (value) => {
    if (!activeFilterPickerField) return;

    setFilters((prev) => ({
      ...prev,
      [activeFilterPickerField]: value,
    }));
    closeFilterPicker();
  };

  const clearFilters = () => {
    setQ("");
    setFilters({});
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => String(v || "").trim() !== "").length +
    (q.trim() ? 1 : 0);

  const isValuePresent = hasValue;

  const getRowDetailColumns = (row) =>
    detailColumns.filter((column) => isValuePresent(row?.[column.name]));

  const resetForm = () => {
    setBusinessName("");
    setRfc("");
    setEmail1("");
    setEmail2("");
    setCelular("");
    setTelefono("");
    setCodigoPostal("");
    setCiudad("");
  };

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createClientApi({
        business_name,
        rfc: rfc || null,
        email1: email1 || null,
        email2: email2 || null,
        celular: celular || null,
        telefono: telefono || null,
        codigo_postal: codigo_postal || null,
        ciudad: ciudad || null,
      });
      resetForm();
      setShowModal(false);
      await load();
    } catch (e2) {
      setError(e2.message || "Error creando cliente");
    }
  };

  const remove = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se eliminarán también sus cotizaciones y contactos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#2277B4",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteClientApi(id);
      await load();
      Swal.fire({
        title: "¡Eliminado!",
        text: "El cliente ha sido eliminado.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "Error eliminando cliente", "error");
    }
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setBusinessName(client.business_name || "");
    setRfc(client.rfc || "");
    setEmail1(client.email1 || "");
    setEmail2(client.email2 || "");
    setCelular(client.celular || "");
    setTelefono(client.telefono || "");
    setCodigoPostal(client.codigo_postal || "");
    setCiudad(client.ciudad || "");
    setShowEditModal(true);
  };

  const updateClient = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await updateClientApi(editingClient.id, {
        business_name,
        rfc: rfc || null,
        email1: email1 || null,
        email2: email2 || null,
        celular: celular || null,
        telefono: telefono || null,
        codigo_postal: codigo_postal || null,
        ciudad: ciudad || null,
      });
      resetForm();
      setEditingClient(null);
      setShowEditModal(false);
      await load();
    } catch (e2) {
      setError(e2.message || "Error actualizando cliente");
    }
  };

  // Definición de columnas para TanStack Table
  const columns = useMemo(() => {
    const dynamicDataColumns = primaryTableColumns.map((column) => ({
      accessorKey: column.name,
      header: column.label,
      size: column.name === "business_name" ? 240 : 180,
      cell: ({ row, getValue }) => {
        const rawValue = getValue();
        const value =
          rawValue === null || rawValue === undefined || rawValue === "" ?
            "—"
          : String(rawValue);

        if (column.name === "business_name") {
          const normalizedBusinessName =
            value !== "—" ?
              `${value.charAt(0).toUpperCase()}${value.slice(1)}`
            : value;
          const firstChar =
            normalizedBusinessName !== "—" ?
              normalizedBusinessName.charAt(0)
            : "•";

          return (
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center border border-gray-200 bg-gray-100 text-gray-900 font-bold text-sm shadow-sm">
                {firstChar}
              </div>
              <span
                className="font-medium text-gray-800 leading-snug min-w-0"
                style={{
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}>
                {normalizedBusinessName}
              </span>
            </div>
          );
        }

        return (
          <span
            className="block w-full text-gray-600 text-sm leading-snug"
            style={{
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}>
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
            title="Registrar nuevo cliente">
            <span className="inline-flex items-center gap-1 text-[#000] no-underline text-sm">
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
              className="w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title={isOpen ? "Ocultar más detalles" : "Ver más detalles"}>
              {isOpen ?
                <ChevronDown size={16} />
              : <ChevronRight size={16} />}
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
                className="px-4 py-1.5 text-sm font-extrabold text-[#2277B4] bg-gradient-to-b from-white to-[#E2E8F0] rounded-xl 
                           border border-[#CBD5E1]/80 hover:from-[#F8FAFC] hover:to-[#CBD5E1] active:from-[#E2E8F0] active:to-[#F1F5F9]
                           shadow-[0_4px_4px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.1),_inset_0_2px_4px_rgba(255,255,255,1),_inset_0_-3px_4px_rgba(0,0,0,0.1)] 
                           active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.2),_inset_0_-2px_2px_rgba(255,255,255,0.5)] 
                           active:translate-y-1 transition-all duration-100 ease-out">
                Gestionar
              </button>
            </Link>
            {(user?.role?.name === "ADMIN" ||
              user?.role?.name === "VENTAS") && (
              <>
                <button
                  onClick={() => openEditModal(row.original)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-800 hover:scale-75 transition-colors"
                  title="Editar">
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => remove(row.original.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-700 hover:scale-75 transition-colors"
                  title="Eliminar">
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
        return (
          value !== null && value !== undefined && String(value).trim() !== ""
        );
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
      Swal.fire({
        title: "Sin datos",
        text: "No hay clientes para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
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
            return isValuePresent(rawValue) ? String(rawValue) : "—";
          }),
        ),
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      doc.save(`Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el PDF.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleExportExcel = async () => {
    const { exportColumns, exportRows } = getExportContext();

    if (!exportRows.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay clientes para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const rows = exportRows.map((row) => {
        const nextRow = {};

        exportColumns.forEach((column) => {
          const rawValue = row?.[column.name];
          nextRow[column.label] = isValuePresent(rawValue) ? rawValue : "";
        });

        return nextRow;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clientes");
      XLSX.writeFile(
        wb,
        `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el Excel.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Clientes Registrados
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiónes y permisos al portal del cliente
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
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">
              Total clientes ({clients.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Búsqueda global */}
            <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cliente..."
                title="Busca por todos los campos. Ignora acentos, mayusculas y caracteres especiales."
                className="bg-transparent border-none text-sm text-gray-800 placeholder:text-gray-400 px-3 w-40 md:w-52 focus:outline-none"
              />
              <div className="px-3 py-1.5 text-black">
                <Search size={16} />
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
              title="Exportar a PDF">
              <FileText size={14} /> Exportar a PDF
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
              title="Exportar a Excel">
              <FileSpreadsheet size={14} /> Exportar a Excel
            </button>

            {/* Botón filtros */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                showFilters || activeFilterCount > 0 ?
                  "bg-[#2277B4] text-white border-[#2277B4]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white text-[#2277B4] rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Botón carga masiva */}
            {(user?.role?.name === "ADMIN" ||
              user?.role?.name === "VENTAS") && (
              <button
                onClick={() => {
                  setShowBulkModal(true);
                  setBulkData([]);
                  setBulkErrors([]);
                  setBulkResult(null);
                  setDriveUrl("");
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1a2b4c] transition-colors">
                <Upload size={15} />
                Cargar clientes
              </button>
            )}

            {/* Limpiar filtros */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
                <X size={14} /> Limpiar
              </button>
            )}

            <span className="text-xs text-gray-400 hidden md:inline">
              Pág. {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount() || 1}
            </span>
          </div>
        </div>

        {activeFilterPickerField &&
          showFilters &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
              onClick={closeFilterPicker}>
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 bg-[#1a2b4c] flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-base">
                      Filtrar por{" "}
                      {activeFilterPickerConfig?.buttonLabel || "campo"}
                    </h3>
                    <p className="text-[11px] text-gray-300 mt-1">
                      Selecciona un valor de la columna{" "}
                      {activeFilterPickerConfig?.modalLabel || ""}
                    </p>
                  </div>
                  <button
                    onClick={closeFilterPicker}
                    className="w-8 h-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <Search size={15} className="text-gray-500" />
                    <input
                      value={filterPickerSearch}
                      onChange={(e) => setFilterPickerSearch(e.target.value)}
                      placeholder="Buscar valor..."
                      className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>

                  <div className="h-72 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-100">
                    {visibleFilterPickerOptions.length > 0 ?
                      visibleFilterPickerOptions.map((value) => {
                        const isSelected =
                          normalizeSearchText(
                            filters[activeFilterPickerField],
                          ) === normalizeSearchText(value);

                        return (
                          <button
                            key={`${activeFilterPickerField}_${value}`}
                            onClick={() => applyFilterValue(value)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              isSelected ?
                                "bg-[#2277B4]/10 text-[#125280] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                            }`}>
                            {value}
                          </button>
                        );
                      })
                    : <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        No hay valores para mostrar.
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {detailColumns.length > 0 && (
          <div className="px-4 py-2 min-h-10 bg-blue-50 border-b border-blue-100 text-xs text-[#2277B4] flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 shrink-0">
              <Lightbulb size={14} className="inline" /> Clic en{" "}
              <ChevronRight size={12} className="inline" /> para más detalles
            </div>

            <div
              className={`flex items-center gap-2 transition-opacity duration-150 ${
                showFilters ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}>
              {quickFilterButtons.map((button) => {
                const selectedValue = String(filters[button.fieldName] || "");
                return (
                  <button
                    key={button.id}
                    onClick={() => openFilterPicker(button.fieldName)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs border transition-colors whitespace-nowrap ${
                      selectedValue ?
                        "bg-[#2277B4] text-white border-[#2277B4]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}>
                    <span className="uppercase font-bold tracking-wide">
                      {button.buttonLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabla */}
        <div
          className={`overflow-x-auto ${isTableScrollable ? "max-h-[65vh] overflow-y-auto" : ""}`}>
          <table className="w-full table-fixed">
            <thead
              className={`bg-gray-50 border-b border-gray-100 ${isTableScrollable ? "sticky top-0 z-20" : ""}`}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`${header.column.id === "expander" ? "glass-flash " : ""}px-4 py-3 text-left text-xs font-semibold text-[#2277B4] uppercase tracking-wider transition-colors ${header.column.getCanSort() ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}`}
                      onClick={
                        header.column.getCanSort() ?
                          header.column.getToggleSortingHandler()
                        : undefined
                      }>
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.length > 0 ?
                table.getRowModel().rows.map((row) => {
                  const rowDetailColumns = getRowDetailColumns(row.original);
                  const isExpanded = !!expandedRows[row.original.id];
                  const detailColumnsByPrimary = primaryTableColumns.reduce(
                    (acc, primaryColumn) => {
                      acc[primaryColumn.name] = [];
                      return acc;
                    },
                    {},
                  );

                  rowDetailColumns.forEach((column) => {
                    const hostColumn =
                      resolveDetailHostColumn(
                        column,
                        primaryTableColumns,
                        detailColumnsByPrimary,
                      ) || primaryTableColumns[0]?.name;

                    if (hostColumn && detailColumnsByPrimary[hostColumn]) {
                      detailColumnsByPrimary[hostColumn].push(column);
                    }
                  });

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 text-sm align-top">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>

                      {isExpanded && rowDetailColumns.length > 0 && (
                        <tr className="bg-gray-50/80">
                          {row.getVisibleCells().map((cell) => {
                            const columnId = cell.column.id;
                            const alignedDetails =
                              detailColumnsByPrimary[columnId] || [];

                            return (
                              <td
                                key={`${cell.id}__detail`}
                                className="px-4 py-4 align-top">
                                {alignedDetails.length > 0 && (
                                  <div className="space-y-3">
                                    {alignedDetails.map((column) => {
                                      const rawValue =
                                        row.original?.[column.name];
                                      const value =
                                        isValuePresent(rawValue) ?
                                          String(rawValue)
                                        : "—";

                                      return (
                                        <div
                                          key={`${row.id}_${column.name}`}
                                          className="min-w-0">
                                          <p className="text-[10px] font-semibold uppercase text-[#2277B4] tracking-wider">
                                            {column.label}
                                          </p>
                                          <p className="text-sm text-gray-700 break-words">
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
              : <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center">
                    <div className="flex justify-center mb-3 opacity-50">
                      <FolderOpen size={36} />
                    </div>
                    <p className="text-gray-500">
                      {loading ?
                        "Cargando clientes..."
                      : "No se encontraron clientes"}
                    </p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {clients.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Mostrar</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] focus:outline-none focus:ring-2 focus:ring-[#153465] bg-[#fff]">
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">por página</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Siguiente
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Nuevo Cliente */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header del modal */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#1a2b4c]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Nuevo Cliente
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#fff] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={create} className="p-6 space-y-4 overflow-y-auto">
                {/* Razón Social */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={business_name}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Empresa SA de CV"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    required
                    autoFocus
                  />
                </div>

                {/* RFC y Correo Principal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RFC
                    </label>
                    <input
                      type="text"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value)}
                      placeholder="XAXX010101000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Principal
                    </label>
                    <input
                      type="email"
                      value={email1}
                      onChange={(e) => setEmail1(e.target.value)}
                      placeholder="contacto@empresa.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    />
                  </div>
                </div>

                {/* Correo Secundario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Secundario
                  </label>
                  <input
                    type="email"
                    value={email2}
                    onChange={(e) => setEmail2(e.target.value)}
                    placeholder="ventas@empresa.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                  />
                </div>

                {/* Celular y Teléfono */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular
                    </label>
                    <input
                      type="tel"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      placeholder="55 1234 5678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="55 9876 5432"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    />
                  </div>
                </div>

                {/* Código Postal y Ciudad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={codigo_postal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder="06600"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ciudad de México"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
                    />
                  </div>
                </div>

                {/* Botones del modal */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#2277B4] text-white font-semibold rounded-xl hover:bg-[#125280] transition-colors shadow-lg shadow-[#2277B4]/30">
                    Registrar Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Edición */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-100 bg-[#1a2b4c] flex items-center justify-between">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                  Editar Cliente
                </h3>
                <X
                  className="cursor-pointer text-white"
                  onClick={() => setShowEditModal(false)}></X>
              </div>
              <form onSubmit={updateClient} className="p-6 space-y-4">
                {/* Razón Social */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ">
                    Razón Social *
                  </label>
                  <Input
                    type="text"
                    required
                    value={business_name}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nombre de la empresa"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                  />
                </div>

                {/* RFC y Correo Principal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RFC
                    </label>
                    <Input
                      type="text"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value)}
                      placeholder="XAXX010101000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Principal
                    </label>
                    <Input
                      type="email"
                      value={email1}
                      onChange={(e) => setEmail1(e.target.value)}
                      placeholder="contacto@empresa.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                    />
                  </div>
                </div>

                {/* Correo Secundario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Secundario
                  </label>
                  <Input
                    type="email"
                    value={email2}
                    onChange={(e) => setEmail2(e.target.value)}
                    placeholder="ventas@empresa.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                  />
                </div>

                {/* Celular y Teléfono */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular
                    </label>
                    <Input
                      type="tel"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      placeholder="55 1234 5678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <Input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="55 9876 5432"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                    />
                  </div>
                </div>

                {/* Código Postal y Ciudad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <Input
                      type="text"
                      value={codigo_postal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder="06600"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <Input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ciudad de México"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]                   "
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingClient(null);
                      resetForm();
                    }}
                    className="flex-1 py-3 text-gray-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#2277B4] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#12528050] hover:bg-[#125280]">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Carga Masiva de Clientes */}
      {showBulkModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-[#1a2b4c] flex items-center justify-between">
                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet size={20} />
                  Carga de Clientes
                </h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-white hover:text-gray-300 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Resultado de la carga */}
                {bulkResult && (
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      bulkResult.success ?
                        "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                    {bulkResult.success ?
                      <>
                        <CheckCircle2 size={18} />
                        Se importaron {bulkResult.count} clientes exitosamente.
                        {bulkResult.skippedCount > 0 && (
                          <span>
                            Se omitieron {bulkResult.skippedCount} filas.
                          </span>
                        )}
                      </>
                    : <>
                        <AlertCircle size={18} />
                        {bulkResult.message}
                      </>
                    }
                  </div>
                )}

                {bulkResult?.success &&
                  bulkResult?.details?.ignoredHeaders?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                      <p className="font-semibold mb-1">
                        Columnas ignoradas del Excel
                      </p>
                      <p>{bulkResult.details.ignoredHeaders.join(", ")}</p>
                    </div>
                  )}

                {bulkResult?.success &&
                  bulkResult?.details?.createdColumns?.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800">
                      <p className="font-semibold mb-1">
                        Columnas nuevas creadas en MySQL
                      </p>
                      <p>
                        {bulkResult.details.createdColumns
                          .map((item) => `${item.header} -> ${item.columnName}`)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                {bulkResult?.success &&
                  bulkResult?.details?.backfillReports?.length > 0 && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-xs text-cyan-800">
                      <p className="font-semibold mb-1">
                        Autocompletado histórico aplicado
                      </p>
                      <p>
                        {bulkResult.details.backfillReports
                          .map(
                            (item) =>
                              `${item.columnName} <- ${item.sourceColumn} (${item.affectedRows})`,
                          )
                          .join(", ")}
                      </p>
                    </div>
                  )}

                {/* Step 1: Descargar plantilla e instrucciones */}
                <div className="bg-[#2277B412] border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#2277B4] mb-2 flex items-center gap-1">
                    <Lightbulb size={15} /> Ayuda
                  </p>
                  <ul className="text-xs text-[#2277B4] space-y-1 mb-3 list-disc pl-5">
                    <li>Los clientes se asignarán automáticamente.</li>
                    <li>
                      También puedes pegar la URL del archivo de Google Drive.
                    </li>
                  </ul>
                </div>

                {/* Step 2: Importar desde Drive */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Importar desde Google Drive
                  </p>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4]"
                  />
                  <button
                    onClick={executeDriveImport}
                    disabled={driveImporting}
                    className="px-4 py-2 bg-[#1a2b4c] text-white text-sm font-semibold rounded-lg hover:bg-[#16233f] transition-colors disabled:opacity-50 flex items-center gap-2">
                    {driveImporting ?
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importando...
                      </>
                    : "Importar"}
                  </button>
                </div>

                {/* Step 3: Subir archivo local */}
                <div>
                  <input
                    ref={bulkFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => bulkFileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 text-gray-500 hover:border-[#2277B4] hover:text-[#2277B4] transition-colors cursor-pointer">
                    <Upload size={28} />
                    <span className="text-sm font-semibold">
                      Haz clic para seleccionar el archivo Excel
                    </span>
                  </button>
                </div>

                {/* Errores de validación */}
                {bulkErrors.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
                      <AlertCircle size={15} /> Advertencias
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                      {bulkErrors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step 3: Vista previa */}
                {bulkData.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Vista previa ({bulkData.length} clientes listos para
                      importar)
                    </p>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                              #
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                              Razón Social
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                              RFC
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                              Correo
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                              Celular
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                              Ciudad
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bulkData.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-400">
                                {i + 1}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {r.business_name}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {r.rfc || "—"}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {r.email1 || "—"}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {r.celular || "—"}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {r.ciudad || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer con botones */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                {bulkData.length > 0 && (
                  <button
                    onClick={executeBulkUpload}
                    disabled={bulkUploading}
                    className="px-6 py-2.5 bg-[#2277B4] text-white font-bold rounded-xl hover:bg-[#125280] transition-colors shadow-lg shadow-[#12528050] disabled:opacity-50 flex items-center gap-2">
                    {bulkUploading ?
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importando...
                      </>
                    : <>
                        <CheckCircle2 size={16} />
                        Importar {bulkData.length} Clientes
                      </>
                    }
                  </button>
                )}
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-5 py-2.5 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
