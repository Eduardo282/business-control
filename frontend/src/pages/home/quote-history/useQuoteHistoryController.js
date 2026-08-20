import { useCallback, useEffect, useMemo, useReducer } from "react";
import Swal from "sweetalert2";
import { deleteQuoteApi, listQuotesApi, updateQuoteStatusApi } from "../../../actionsAPI/quotes.api";
import { exportRowsToExcel } from "../../../utils/excelExport";
import { normalizeSearchText } from "../../../utils/formatters";
import { exportPdfTable } from "../../../utils/pdfTableExport";
import { getQuoteDisplayStatus } from "../../../utils/quoteStatus";
import { useNotifications } from "../../../context/NotificationContext.jsx";

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
    case "CLEAR_SINGLE_FILTER":
      return { ...state, filters: { ...state.filters, [action.payload]: "" } };
    default:
      return state;
  }
}

export default function useQuoteHistoryController() {
  const { refreshNotifications } = useNotifications();
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

  const loadQuotes = useCallback((background = false) => {
    if (!background) dispatchData({ type: "FETCH_START" });
    listQuotesApi()
      .then((res) => dispatchData({ type: "FETCH_SUCCESS", payload: res }))
      .catch((e) => {
        if (!background) {
          const msg =
            e.response?.data?.errors?.[0]?.message ||
            e.message ||
            "Error al cargar cotizaciones";
          dispatchData({ type: "FETCH_ERROR", payload: msg });
        }
      });
  }, []);

  useEffect(() => {
    loadQuotes(); // Initial foreground fetch
    
    const interval = setInterval(() => loadQuotes(true), 30000);

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        loadQuotes(true);
      }
    };

    window.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadQuotes]);

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
      refreshNotifications?.();
      Swal.fire({
        title: "¡Eliminada!",
        text: "Cotización eliminada correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
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
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  }, [refreshNotifications]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await updateQuoteStatusApi(id, newStatus);
      dispatchData({ type: "UPDATE_QUOTE_STATUS", payload: { id, status: newStatus } });
      refreshNotifications?.();
      
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: "success",
        title: `${newStatus}`,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo actualizar el estado",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  }, [dispatchData, refreshNotifications]);

  const filteredQuotes = useMemo(() => {
    const s = normalizeSearchText(q);
    const hasFieldFilters = Object.values(filters).some((v) => v.trim() !== "");
    if (!s && !hasFieldFilters) return quotes;

    return quotes.filter((quote) => {
      const id = quote?.id != null ? `#${quote.id}` : "";
      const folio = quote?.folio || "";
      const client = quote?.client?.business_name || "";
      const contact = quote?.contact?.full_name || "";
      const status = getQuoteDisplayStatus(quote);
      
      const total =
        quote?.total != null ?
          String(Number(quote.total).toFixed(2))
        : "";
      const createdAt =
        quote?.created_at ?
          new Date(quote.created_at).toLocaleDateString()
        : "";

      const haystack = normalizeSearchText(
        [id, folio, client, contact, createdAt, total, status].join(" "),
      );

      const matchQ = !s || haystack.includes(s);

      let matchClient = true;
      if (filters.client.trim()) {
        matchClient =
          normalizeSearchText(quote?.client?.business_name || "") ===
          normalizeSearchText(filters.client);
      }

      let matchStatus = true;
      if (filters.status.trim()) {
        matchStatus =
          normalizeSearchText(status) ===
          normalizeSearchText(filters.status);
      }

      let matchFolio = true;
      if (filters.folio.trim()) {
        matchFolio =
          normalizeSearchText(quote?.folio || "") ===
          normalizeSearchText(filters.folio);
      }

      return matchQ && matchClient && matchStatus && matchFolio;
    });
  }, [quotes, q, filters]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim() !== "",
  ).length;

  const openFilterPicker = useCallback((fieldName) => {
    dispatchFilter({ type: "OPEN_FILTER_PICKER", payload: fieldName });
  }, []);

  const closeFilterPicker = useCallback(() => {
    dispatchFilter({ type: "CLOSE_FILTER_PICKER" });
  }, []);

  const applyFilterValue = useCallback((value) => {
    dispatchFilter({ type: "APPLY_FILTER", payload: value });
  }, []);

  const clearFilters = useCallback(() => {
    dispatchFilter({ type: "CLEAR_FILTERS" });
  }, []);

  const clearSingleFilter = useCallback((fieldName) => {
    dispatchFilter({ type: "CLEAR_SINGLE_FILTER", payload: fieldName });
  }, []);

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
        value = getQuoteDisplayStatus(quote);
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

  const handleExportPDF = useCallback(async () => {
    if (!filteredQuotes.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay cotizaciones para exportar.",
        icon: "info",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      await exportPdfTable({
        title: "Historial de Cotizaciones",
        filename: `Historial_Cotizaciones_${new Date().toISOString().slice(0, 10)}.pdf`,
        head: [
          [
            "COTIZACIÓN",
            "FOLIO",
            "CLIENTE",
            "CONTACTO",
            "FECHA",
            "TOTAL (C/IVA)",
            "ESTADO",
          ],
        ],
        body: filteredQuotes.map((row) => {
          const idStr = `Cotización #${row.id}`;
          const folioStr = row.folio || "—";
          const clientStr = row.client?.business_name || "—";
          const contactStr = row.contact?.full_name || "Sin contacto";
          const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "—";
          const totalStr = `$${Number(row.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
          const statusStr = getQuoteDisplayStatus(row);
          return [idStr, folioStr, clientStr, contactStr, dateStr, totalStr, statusStr];
        }),
        recordCount: filteredQuotes.length,
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: "auto" },
          3: { cellWidth: 45 },
          4: { cellWidth: 24 },
          5: { cellWidth: 30 },
          6: { cellWidth: 24 },
        },
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el PDF.",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  }, [filteredQuotes]);

  const handleExportExcel = useCallback(async () => {
    if (!filteredQuotes.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay cotizaciones para exportar.",
        icon: "info",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      const rows = filteredQuotes.map((row) => {
        const contactStr = row.contact?.full_name || "Sin contacto";
        const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "—";
        const statusStr = getQuoteDisplayStatus(row);

        return {
          "Cotización": `Cotización #${row.id}`,
          "Folio": row.folio || "—",
          "Cliente": row.client?.business_name || "—",
          "Contacto": contactStr,
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
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  }, [filteredQuotes]);

  return {
    activeFilterCount,
    activeFilterPickerField,
    applyFilterValue,
    clearFilters,
    clearSingleFilter,
    closeFilterPicker,
    dispatchFilter,
    error,
    filteredQuotes,
    filterPickerSearch,
    filters,
    handleDeleteQuote,
    handleExportExcel,
    handleExportPDF,
    handleStatusChange,
    loading,
    openFilterPicker,
    q,
    quotes,
    showFilters,
    visibleFilterPickerOptions,
  };
}
