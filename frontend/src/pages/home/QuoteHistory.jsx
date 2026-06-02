import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { deleteQuoteApi, listQuotesApi, updateQuoteStatusApi } from "../../actionsAPI/quotes.api";
import { useAuth } from "../../hooks/useAuth";
import {
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  FileText,
  FileSpreadsheet,
  FolderOpen,
} from "@icons";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { exportRowsToExcel } from "../../utils/excelExport";
import { normalizeSearchText } from "../../utils/formatters";

function dataReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, quotes: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "DELETE_QUOTE":
      return { ...state, quotes: state.quotes.filter((q) => String(q.id) !== String(action.payload)) };
    case "UPDATE_QUOTE_STATUS":
      return {
        ...state,
        quotes: state.quotes.map((q) =>
          String(q.id) === String(action.payload.id)
            ? { ...q, status: action.payload.status }
            : q
        ),
      };
    default:
      return state;
  }
}

function filterReducer(state, action) {
  switch (action.type) {
    case "SET_Q":
      return { ...state, q: action.payload };
    case "TOGGLE_FILTERS":
      return { ...state, showFilters: !state.showFilters };
    case "OPEN_FILTER_PICKER":
      return { ...state, activeFilterPickerField: action.payload, filterPickerSearch: "" };
    case "CLOSE_FILTER_PICKER":
      return { ...state, activeFilterPickerField: null, filterPickerSearch: "" };
    case "SET_FILTER_PICKER_SEARCH":
      return { ...state, filterPickerSearch: action.payload };
    case "APPLY_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [state.activeFilterPickerField]: action.payload },
        activeFilterPickerField: null,
        filterPickerSearch: "",
      };
    case "CLEAR_FILTERS":
      return { ...state, filters: { client: "", status: "", folio: "" }, activeFilterPickerField: null, filterPickerSearch: "" };
    default:
      return state;
  }
}

function StatusCell({ row, handleStatusChange }) {
  const currentStatus = row.original.status || "PENDING";
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const statusOptions = [
    { value: "REQUESTED", label: "SOLICITADA", color: "text-blue-600 border-blue-600/30 bg-blue-50 dark:bg-blue-500/10" },
    { value: "PENDING", label: "PENDIENTE", color: "text-yellow-600 border-yellow-600/30 bg-yellow-50 dark:bg-yellow-500/10" },
    { value: "SENT", label: "ENVIADA", color: "text-indigo-600 border-indigo-600/30 bg-indigo-50 dark:bg-indigo-500/10" },
    { value: "ACCEPTED", label: "ACEPTADA", color: "text-emerald-600 border-emerald-600/30 bg-emerald-50 dark:bg-emerald-500/10" },
    { value: "REJECTED", label: "RECHAZADA", color: "text-red-600 border-red-600/30 bg-red-50 dark:bg-red-500/10" },
  ];

  const currentOption = statusOptions.find((o) => o.value === currentStatus);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 128, // alignment to match trigger (w-32 is 128px)
      });
    }
  };

  const handleToggle = () => {
    updateCoords();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  return (
    <div className="text-right flex justify-end">
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={`text-[10px] uppercase font-bold tracking-wider pl-2 pr-6 py-1 rounded bg-transparent border focus:outline-none transition-colors cursor-pointer text-center min-w-[110px] relative ${currentOption?.color}`}
        >
          {currentOption?.label}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
            <ChevronDown size={10} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {isOpen &&
          createPortal(
            <>
              <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />
              <div
                style={{
                  position: "absolute",
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                }}
                className="mt-1 w-32 bg-white dark:bg-dark-900 rounded-lg shadow-xl border border-zinc-200 dark:border-white/10 z-[10000] overflow-hidden animate-fade-in-down"
              >
                {statusOptions
                  .filter((opt) => opt.value !== currentStatus && opt.value !== "SENT")
                  .map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        handleStatusChange(row.original.id, opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-[10px] font-bold text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-l-2 border-transparent ${opt.color.split(" ")[0]}`}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>
            </>,
            document.body,
          )}
      </div>
    </div>
  );
}

export default function QuoteHistory() {
  const { user } = useAuth();
  const [data, dispatchData] = useReducer(dataReducer, { quotes: [], loading: true, error: "" });
  const { quotes, loading, error } = data;
  const [fState, dispatchFilter] = useReducer(filterReducer, {
    q: "",
    showFilters: false,
    filters: { client: "", status: "", folio: "" },
    activeFilterPickerField: null,
    filterPickerSearch: "",
  });
  const { q, showFilters, filters, activeFilterPickerField, filterPickerSearch } = fState;
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    dispatchData({ type: "FETCH_START" });
    listQuotesApi()
      .then((res) => dispatchData({ type: "FETCH_SUCCESS", payload: res }))
      .catch((e) => {
        const msg =
          e.response?.data?.errors?.[0]?.message ||
          e.message ||
          "Error al cargar cotizaciones";
        dispatchData({ type: "FETCH_ERROR", payload: msg });
      });
  }, []);

  const handleDeleteQuote = useCallback(async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar cotización?",
      text: "Esta acción borrará la cotización de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteQuoteApi(id);
      dispatchData({ type: "DELETE_QUOTE", payload: id });
      Swal.fire({
        title: "¡Eliminada!",
        text: "La cotización se eliminó correctamente de la base de datos.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const message =
        e?.response?.data?.errors?.[0]?.message ||
        e?.message ||
        "No se pudo eliminar la cotización.";

      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  }, []);

  const handleExportPDF = async () => {
    if (!filteredQuotes.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay cotizaciones para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.setTextColor(26, 43, 76);
      doc.text("Historial de Cotizaciones", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);

      autoTable(doc, {
        startY: 28,
        head: [
          [
            "COTIZACIÓN",
            "FOLIO",
            "CLIENTE",
            "CREADA POR",
            "FECHA",
            "TOTAL (C/IVA)",
            "ESTADO",
          ],
        ],
        body: filteredQuotes.map((row) => {
          const idStr = `Cotización #${row.id}`;
          const folioStr = row.folio || "—";
          const clientStr = row.client?.business_name || "—";
          const creatorStr = row.user?.full_name || row.contact?.full_name || "Usuario";
          const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "—";
          const totalStr = `$${Number(row.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
          const statusStr = 
            row.status === "PENDING" ? "PENDIENTE"
            : row.status === "REQUESTED" ? "SOLICITADA"
            : row.status === "ACCEPTED" ? "ACEPTADA"
            : row.status === "REJECTED" ? "RECHAZADA"
            : row.status;
          return [idStr, folioStr, clientStr, creatorStr, dateStr, totalStr, statusStr];
        }),
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 65 },
          3: { cellWidth: 50 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25 },
        },
      });

      doc.save(
        `Historial_Cotizaciones_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el PDF.",
        icon: "error",
        confirmButtonColor: "#2277B4",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!filteredQuotes.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay cotizaciones para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    try {
      const rows = filteredQuotes.map((row) => {
        const creatorStr = row.user?.full_name || row.contact?.full_name || "Usuario";
        const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "—";
        const statusStr = 
          row.status === "PENDING" ? "PENDIENTE"
          : row.status === "REQUESTED" ? "SOLICITADA"
          : row.status === "ACCEPTED" ? "ACEPTADA"
          : row.status === "REJECTED" ? "RECHAZADA"
          : row.status;

        return {
          "Cotización": `Cotización #${row.id}`,
          "Folio": row.folio || "—",
          "Cliente": row.client?.business_name || "—",
          "Creada por": creatorStr,
          "Fecha": dateStr,
          "Total (C/IVA)": Number(row.total || 0),
          "Estado": statusStr,
        };
      });

      await exportRowsToExcel({
        rows,
        sheetName: "Cotizaciones",
        fileName: `Historial_Cotizaciones_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el Excel.",
        icon: "error",
        confirmButtonColor: "#2277B4",
      });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateQuoteStatusApi(id, newStatus);
      dispatchData({ type: "UPDATE_QUOTE_STATUS", payload: { id, status: newStatus } });
      
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: "success",
        title: `Estado actualizado a ${newStatus}`,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "No se pudo actualizar el estado", "error");
    }
  };

  const filterFieldLabels = {
    client: "Cliente",
    status: "Estado",
    folio: "Folio",
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim() !== "",
  ).length;

  const openFilterPicker = (fieldName) => {
    dispatchFilter({ type: "OPEN_FILTER_PICKER", payload: fieldName });
  };

  const closeFilterPicker = () => {
    dispatchFilter({ type: "CLOSE_FILTER_PICKER" });
  };

  const applyFilterValue = (value) => {
    if (!activeFilterPickerField) return;
    dispatchFilter({ type: "APPLY_FILTER", payload: value });
  };

  const clearFilters = () => {
    dispatchFilter({ type: "CLEAR_FILTERS" });
  };

  useEffect(() => {
    if (!showFilters) {
      dispatchFilter({ type: "CLOSE_FILTER_PICKER" });
    }
  }, [showFilters]);

  const filterPickerOptions = useMemo(() => {
    if (!activeFilterPickerField) return [];

    const uniqueValues = new Map();

    quotes.forEach((quote) => {
      let value = "";

      if (activeFilterPickerField === "client") {
        value = quote?.client?.business_name || "";
      } else if (activeFilterPickerField === "status") {
        value = quote?.status || "";
      } else if (activeFilterPickerField === "folio") {
        value = quote?.folio || "";
      }

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;
      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [quotes, activeFilterPickerField]);

  const visibleFilterPickerOptions = useMemo(() => {
    const s = normalizeSearchText(filterPickerSearch);
    if (!s) return filterPickerOptions;

    return filterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(s),
    );
  }, [filterPickerSearch, filterPickerOptions]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Cotización",
        cell: ({ row }) => (
          <div className="font-bold text-light-text-primary dark:text-zinc-100">
            Cotización #{row.original.id}
          </div>
        ),
      },
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }) => (
          <div className="text-sm font-mono font-bold text-[#2277B4] dark:text-blue-400 tracking-wider">
            {row.original.folio || "—"}
          </div>
        ),
      },
      {
        accessorKey: "client.business_name",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="text-sm text-light-text-secondary dark:text-zinc-400">
            {row.original.client?.business_name || "—"}
          </div>
        ),
      },
      {
        accessorKey: "user.full_name",
        header: "Creada por",
        cell: ({ row }) => (
          <div className="text-sm text-light-text-secondary dark:text-zinc-400">
            {row.original.user?.full_name || row.original.contact?.full_name || "Usuario"}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="text-sm text-light-text-secondary dark:text-zinc-400" suppressHydrationWarning>
            {row.original.created_at ?
              new Date(row.original.created_at).toLocaleDateString()
            : "—"}
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total (c/IVA)",
        cell: ({ row }) => (
          <div className="font-bold text-stone-600 dark:text-zinc-300 text-right">
            $
            {Number(row.original.total || 0).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusCell row={row} handleStatusChange={handleStatusChange} />
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/cotizaciones/${row.original.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#2277B4] dark:text-blue-400 bg-white dark:bg-dark-800 rounded-lg border border-[#CBD5E1] dark:border-dark-600 hover:bg-[#F8FAFC] dark:hover:bg-dark-700 hover:border-[#B8C6D8] dark:hover:border-dark-500 shadow-sm transition-colors duration-150">
              <ExternalLink size={14} /> Ver
            </Link>
            {user?.role?.name !== "SOPORTE" && (
              <button
                onClick={() => handleDeleteQuote(row.original.id)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                title="Eliminar cotización">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [handleDeleteQuote, user?.role?.name],
  );

  const filteredQuotes = useMemo(() => {
    const s = normalizeSearchText(q);
    const hasFieldFilters = Object.values(filters).some((v) => v.trim() !== "");
    if (!s && !hasFieldFilters) return quotes;

    return quotes.filter((quote) => {
      const id = quote?.id != null ? `#${quote.id}` : "";
      const folio = quote?.folio || "";
      const client = quote?.client?.business_name || "";
      const seller = quote?.user?.full_name || quote?.contact?.full_name || "";
      const status = quote?.status || "";
      const total =
        quote?.total != null ?
          String(Number(quote.total).toFixed(2))
        : "";
      const createdAt =
        quote?.created_at ?
          new Date(quote.created_at).toLocaleDateString()
        : "";

      const haystack = normalizeSearchText(
        [id, folio, client, seller, createdAt, total, status].join(" "),
      );

      const matchQ = !s || haystack.includes(s);

      const matchFilters =
        !hasFieldFilters ||
        ((!filters.client ||
          normalizeSearchText(client).includes(
            normalizeSearchText(filters.client),
          )) &&
          (!filters.status ||
            normalizeSearchText(status) ===
              normalizeSearchText(filters.status)) &&
          (!filters.folio ||
            normalizeSearchText(folio) === normalizeSearchText(filters.folio)));

      return matchQ && matchFilters;
    });
  }, [quotes, q, filters]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [q, filters]);

  useEffect(() => {
    const maxPageIndex = Math.max(
      0,
      Math.ceil(filteredQuotes.length / pagination.pageSize) - 1,
    );

    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [filteredQuotes.length, pagination.pageIndex, pagination.pageSize]);

  const table = useReactTable({
    data: filteredQuotes,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BadgeDollarSign size={28} className="text-light-text-primary dark:text-zinc-100" />
          <div>
            <h1 className="text-3xl font-semibold text-light-text-primary dark:text-zinc-100">
              Historial de Cotizaciones
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-zinc-400">
              Consulta rápida de las cotizaciones generadas.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => dispatchFilter({ type: "SET_Q", payload: e.target.value })}
              placeholder="Buscar por cliente, vendedor…"
              className="w-full sm:w-80 pl-4 pr-11 py-3 bg-white dark:bg-dark-900 border border-zinc-300 dark:border-dark-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-500/30 focus:border-[#2277B4] dark:focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-500/30 bg-white dark:bg-dark-900 text-red-700 dark:text-red-400 hover:bg-red-50 hover:dark:bg-red-500/20 transition-colors whitespace-nowrap"
            title="Exportar a PDF">
            <FileText size={14} /> Exportar a PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-dark-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 hover:dark:bg-emerald-500/20 transition-colors whitespace-nowrap"
            title="Exportar a Excel">
            <FileSpreadsheet size={14} /> Exportar a Excel
          </button>

          <button
            onClick={() => dispatchFilter({ type: "TOGGLE_FILTERS" })}
            className={`inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
              showFilters || activeFilterCount > 0 ?
                "bg-[#2277B4] text-white border-[#2277B4]"
              : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-800"
            }`}>
            <SlidersHorizontal size={14} /> Filtros
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-white text-[#1a2b4c] text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-light-error/10 dark:bg-red-500/10 border border-light-error/20 dark:border-red-500/30 text-light-error dark:text-red-200 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-light-text-secondary dark:text-zinc-500 py-10 animate-pulse">
          Cargando historial...
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 text-center text-light-text-secondary dark:text-zinc-500 py-14">
          <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium">No se encontraron cotizaciones.</p>
        </div>
      )}

      {!loading &&
        !error &&
        quotes.length > 0 &&
        filteredQuotes.length === 0 && (
          <Card className="overflow-hidden">
            <div className="flex flex-col items-center justify-center gap-3 text-center text-light-text-secondary dark:text-zinc-500 py-14">
              <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-medium">No se encontraron cotizaciones.</p>
            </div>
          </Card>
        )}

      {!loading && !error && filteredQuotes.length > 0 && (
        <Card className="overflow-hidden">
          {activeFilterPickerField &&
            showFilters &&
            createPortal(
              <div
                role="button"
                tabIndex={0}
                className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
                onClick={closeFilterPicker}
                onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") closeFilterPicker(); }}>
                <div
                  role="dialog"
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-base uppercase">
                        FILTRAR POR {filterFieldLabels[activeFilterPickerField]}
                      </h3>
                      <p className="text-[11px] text-zinc-300 mt-1">
                        Selecciona o busca un valor
                      </p>
                    </div>
                    <button
                      onClick={closeFilterPicker}
                      className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                      <Search size={15} className="text-zinc-500" />
                      <input
                        value={filterPickerSearch}
                        onChange={(e) => dispatchFilter({ type: "SET_FILTER_PICKER_SEARCH", payload: e.target.value })}
                        placeholder="Buscar valor…"
                        className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                      />
                    </div>

                    <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                      {visibleFilterPickerOptions.length > 0 ?
                        visibleFilterPickerOptions.map((value) => {
                          const isSelected =
                            normalizeSearchText(
                              filters[activeFilterPickerField],
                            ) === normalizeSearchText(value);

                          let displayValue = value;
                          if (activeFilterPickerField === "status") {
                            const statusMap = {
                              PENDING: "PENDIENTE",
                              REQUESTED: "SOLICITADA",
                              SENT: "ENVIADA",
                              ACCEPTED: "ACEPTADA",
                              REJECTED: "RECHAZADA",
                            };
                            displayValue = statusMap[value] || value;
                          }

                          return (
                            <button
                              key={`${activeFilterPickerField}_${value}`}
                              onClick={() => applyFilterValue(value)}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isSelected ?
                                  "bg-[#2277B4]/10 text-[#125280] font-semibold"
                                : "text-zinc-700 hover:bg-zinc-50"
                              }`}>
                              {displayValue}
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

          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 min-h-[38px] flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "client", label: "Cliente" },
                { id: "status", label: "Estado" },
                { id: "folio", label: "Folio" },
              ].map((button) => {
                const selectedValue = String(filters[button.id] || "");

                return (
                  <button
                    key={button.id}
                    onClick={() => openFilterPicker(button.id)}
                    tabIndex={showFilters ? 0 : -1}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-all whitespace-nowrap ${
                      selectedValue ?
                        "bg-[#2277B4] text-white border-[#2277B4]"
                      : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-800"
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

              <button
                onClick={clearFilters}
                tabIndex={showFilters && activeFilterCount > 0 ? 0 : -1}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-all ${
                  showFilters && activeFilterCount > 0 ?
                    "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-1 pointer-events-none"
                }`}>
                <X size={12} /> Limpiar
              </button>
            </div>

            <span className="text-xs text-light-text-secondary">
              Pág. {table.getState().pagination.pageIndex + 1} de{" "}
              {Math.max(1, table.getPageCount())}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="uppercase text-xs font-bold tracking-wider text-[#2277B4] dark:text-blue-400 border-b border-light-border dark:border-zinc-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`p-4 ${
                          (
                            header.column.id === "total" ||
                            header.column.id === "status"
                          ) ?
                            "text-right"
                          : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          cursor:
                            header.column.getCanSort() ? "pointer" : "default",
                        }}>
                        <div
                          className={`flex items-center gap-1 ${
                            (
                              header.column.id === "total" ||
                              header.column.id === "status" ||
                              header.column.id === "actions"
                            ) ?
                              "justify-end"
                            : ""
                          }`}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <ChevronUp size={14} />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ChevronDown size={14} />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-light-border dark:divide-zinc-800">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`p-4 align-middle ${
                          (
                            cell.column.id === "total" ||
                            cell.column.id === "status" ||
                            cell.column.id === "actions"
                          ) ?
                            "text-right"
                          : ""
                        }`}>
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

          <div className="px-4 py-3 border-t border-light-border dark:border-dark-700 bg-white dark:bg-dark-900 flex items-center justify-between gap-3 flex-wrap">
            <label className="text-sm text-light-text-secondary dark:text-zinc-400 flex items-center gap-2">
              Mostrar
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  }));
                }}
                className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-[#fff] dark:bg-dark-900 border border-light-border dark:border-dark-700">
                {[10, 25, 50, 100].map((size) => (
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
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                »»
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
