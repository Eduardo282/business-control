import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, FolderOpen, Clock, History, ExternalLink, Trash2, X, Plus, Minus, Search, FileSpreadsheet, Building2, Globe, BadgeDollarSign, Package, Users, User, ClipboardList, Download, Shield, LayoutDashboard, ShoppingBag, ShoppingCart } from "@icons";
import {
  acceptPortalQuoteApi,
  deletePortalQuoteApi,
  listPortalQuotesApi,
  rejectPortalQuoteApi,
  updatePortalQuoteRequestApi,
} from "../../actionsAPI/portal.api";
import Swal from "sweetalert2";
import { logger } from "../../services/logger";
import { getQuoteDisplayStatus } from "../../utils/quoteStatus";

/* ── Reducer ─────────────────────────────────────────────── */

function portalReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, quotes: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "DELETE_QUOTE":
      return { ...state, quotes: state.quotes.filter((q) => String(q.id) !== String(action.payload)) };
    case "UPDATE_QUOTE_TOTAL":
      return {
        ...state,
        quotes: state.quotes.map((q) =>
          q.id === action.payload.id ? { ...q, total: action.payload.total } : q,
        ),
      };
    case "UPDATE_QUOTE_STATUS":
      return {
        ...state,
        quotes: state.quotes.map((q) =>
          String(q.id) === String(action.payload.id)
            ? { ...q, status: action.payload.status }
            : q,
        ),
      };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload, page: 1 };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload, page: 1 };
    case "OPEN_EDIT_MODAL":
      return { ...state, editingQuote: action.payload, editItems: action.payload.items.map((i) => ({ ...i })) };
    case "CLOSE_EDIT_MODAL":
      return { ...state, editingQuote: null, editItems: [] };
    case "UPDATE_EDIT_QUANTITY": {
      const { itemId, change } = action.payload;
      return {
        ...state,
        editItems: state.editItems.map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item,
        ),
      };
    }
    case "SET_SAVING_EDIT":
      return { ...state, savingEdit: action.payload };
    default:
      return state;
  }
}

const PRODUCT_LOGO_MAP = {
  "CONTPAQi Contabilidad": FileSpreadsheet,
  "CONTPAQi Bancos": Building2,
  "CONTPAQi Contabiliza (Nube)": Globe,
  "CONTPAQi Gastos": BadgeDollarSign,
  "CONTPAQi Comercial Premium": ShoppingBag,
  "CONTPAQi Comercial Pro": ShoppingCart,
  "CONTPAQi Comercial Start": Package,
  "CONTPAQi Factura Electrónica": FileText,
  "CONTPAQi Vende (Nube)": ShoppingCart,
  "CONTPAQi Punto de Venta": Building2,
  "CONTPAQi Nóminas": Users,
  "CONTPAQi Personia (Nube)": User,
  "CONTPAQi Evalúa": ClipboardList,
  "CONTPAQi XML en Línea+": Download,
  "CONTPAQi Respaldos": Shield,
  "CONTPAQi Escritorio Virtual": Building2,
  "CONTPAQi Optimiza": LayoutDashboard,
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PORTAL_QUOTES_RENDER_NOW = Date.now();

const initialState = {
  quotes: [],
  loading: true,
  error: "",
  statusFilter: "",
  page: 1,
  pageSize: 5,
  editingQuote: null,
  editItems: [],
  savingEdit: false,
};

/* ── Sub-components ──────────────────────────────────────── */

function StatusBadge({ status }) {
  const styles = {
    SOLICITADA: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
    PENDIENTE: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    ACEPTADA: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    RECHAZADA: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
    ENVIADA: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
  };

  const labels = {
    SOLICITADA: "Solicitada",
    PENDIENTE: "Pendiente",
    ACEPTADA: "Aceptada",
    RECHAZADA: "Rechazada",
    ENVIADA: "Enviada",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-semibold tracking-wide border inline-flex ${
        styles[status] || "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function PortalHeader({ filter, statusFilter, onStatusFilterChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
        {filter === "recent" ? (
          <>
            <Clock size={24} className="text-black dark:text-zinc-100" /> Cotizaciones Recientes
          </>
        ) : (
          <>
            <History size={24} className="text-black dark:text-zinc-100" /> Historial de Cotizaciones
          </>
        )}
      </h2>
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="pl-3 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400 text-zinc-700 dark:text-zinc-200 shadow-sm dark:shadow-black/20 appearance-none"
          >
            <option value="">Buscar estados</option>
            <option value="SOLICITADA">Solicitada</option>
            <option value="ENVIADA">Enviada</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteRow({ quote, onDelete, onDecision, respondingQuoteId }) {
  const createdDate = new Date(quote.created_at);
  const expirationDate = new Date(createdDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  const computedStatus = getQuoteDisplayStatus(quote);
  const canRespond = computedStatus === "ENVIADA";
  const isResponding = String(respondingQuoteId) === String(quote.id);

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/30 shrink-0">
            <FileText size={16} className="text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
            Cotización #{quote.id}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm font-mono font-semibold text-[#2277B4] dark:text-blue-400 tracking-wider">
          {quote.folio || "—"}
        </div>
      </td>
      <td className="p-4 text-zinc-600 dark:text-zinc-300" suppressHydrationWarning>
        {createdDate.toLocaleDateString("es-MX")}
      </td>
      <td className="p-4 text-zinc-600 dark:text-zinc-300 font-medium" suppressHydrationWarning>
        {expirationDate.toLocaleDateString("es-MX")}
      </td>
      <td className="p-4 text-right">
        <div className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-base">
          $
          {Number(quote.total).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}
        </div>
      </td>
      <td className="p-4 text-center">
        {canRespond ? (
          <select
            aria-label={`Responder cotización ${quote.folio || quote.id}`}
            disabled={isResponding}
            value=""
            onChange={(event) => onDecision(quote, event.target.value)}
            className="min-w-[132px] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-black/20"
          >
            <option value="">{isResponding ? "Guardando..." : "Aceptar/Rechazar"}</option>
            <option value="ACEPTADA">Aceptar</option>
            <option value="RECHAZADA">Rechazar</option>
          </select>
        ) : (
          <StatusBadge status={computedStatus} />
        )}
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/portal/quotes/${quote.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1a2b4c] dark:text-blue-300 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-500 shadow-sm dark:shadow-black/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
          >
            <ExternalLink size={14} /> Ver
          </Link>

          <button
            onClick={() => onDelete(quote.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 rounded-lg border border-red-100 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/30"
            title="Eliminar solicitud"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PaginationControls({ page, totalPages, totalItems, startIndex, endIndex, pageSize, dispatch }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 gap-4">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Mostrando <span className="font-semibold text-zinc-700 dark:text-zinc-200">{totalItems === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-semibold text-zinc-700 dark:text-zinc-200">{totalItems}</span> cotizaciones
      </div>

      <div className="flex items-center gap-4">
        <select
          value={pageSize}
          onChange={(e) => dispatch({ type: "SET_PAGE_SIZE", payload: Number(e.target.value) })}
          className="pl-3 pr-8 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400 text-zinc-700 dark:text-zinc-200 shadow-sm dark:shadow-black/20 appearance-none relative"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: 1 })}
            disabled={page === 1}
            className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
            title="Primera página"
          >
            ««
          </button>
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: Math.max(1, page - 1) })}
            disabled={page === 1}
            className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap min-w-[70px] text-center">
            Pág. {page} / {totalPages}
          </span>
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: Math.min(totalPages, page + 1) })}
            disabled={page === totalPages}
            className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
            title="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: totalPages })}
            disabled={page === totalPages}
            className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-950 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
            title="Última página"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}

function EditQuoteModal({ editingQuote, editItems, savingEdit, dispatch, onSave }) {
  if (!editingQuote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl dark:shadow-black/50 w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-white/10 dark:border-zinc-700 bg-[#1B4733] dark:bg-emerald-950 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Editar Cotización #{editingQuote.id}
          </h3>
          <button
            onClick={() => dispatch({ type: "CLOSE_EDIT_MODAL" })}
            className="text-zinc-300 dark:text-zinc-400 hover:text-white dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Ajusta las cantidades de los productos en tu solicitud.
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {editItems.map((item) => {
              const name = item.product?.name || "Producto";
              const Logo = PRODUCT_LOGO_MAP[name] || Package;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <div className="relative shrink-0">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">
                        <Logo size={20} />
                      </span>
                      {item.quantity > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-950 text-[9px] font-bold px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white dark:border-zinc-900 shadow-sm">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm truncate" title={name}>
                        {name}
                      </h4>
                      {item.product?.folio && (
                        <div className="text-[11px] font-mono font-semibold text-[#2277B4] dark:text-blue-400 mt-0.5">
                          {item.product.folio}
                        </div>
                      )}
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Precio Unitario (aprox): ${Number(item.total / item.quantity || 0).toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => dispatch({ type: "UPDATE_EDIT_QUANTITY", payload: { itemId: item.id, change: -1 } })}
                    className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-100 w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => dispatch({ type: "UPDATE_EDIT_QUANTITY", payload: { itemId: item.id, change: 1 } })}
                    className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
            <button
              onClick={() => dispatch({ type: "CLOSE_EDIT_MODAL" })}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-semibold text-white dark:text-emerald-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300 rounded-xl transition-colors disabled:bg-emerald-300 dark:disabled:bg-emerald-950 disabled:text-emerald-700 dark:disabled:text-emerald-600 disabled:opacity-100 disabled:cursor-not-allowed"
            >
              {savingEdit ? "Guardando\u2026" : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function PortalQuotes() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "recent";
  const [state, dispatch] = useReducer(portalReducer, initialState);
  const [respondingQuoteId, setRespondingQuoteId] = useState(null);
  const { quotes, loading, error, statusFilter, page, pageSize, editingQuote, editItems, savingEdit } = state;

  const loadQuotes = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await listPortalQuotesApi();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (e) {
      logger.error("Error loading portal quotes", e);
      const msg = e.response?.data?.errors?.[0]?.message || e.message || "Error al cargar cotizaciones";
      dispatch({ type: "FETCH_ERROR", payload: msg });
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar solicitud?",
      text: "Esta acción borrará la solicitud de cotización de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deletePortalQuoteApi(id);
      dispatch({ type: "DELETE_QUOTE", payload: id });

      // Ajustar página si se elimina el último elemento
      if (currentQuotes.length === 1 && page > 1) {
        dispatch({ type: "SET_PAGE", payload: page - 1 });
      }

      Swal.fire({
        title: "¡Eliminada!",
        text: "La solicitud fue eliminada correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo eliminar.",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  const handleSaveEdit = async () => {
    dispatch({ type: "SET_SAVING_EDIT", payload: true });
    try {
      const payload = editItems.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

      const updatedQuote = await updatePortalQuoteRequestApi(editingQuote.id, payload);

      dispatch({ type: "UPDATE_QUOTE_TOTAL", payload: { id: updatedQuote.id, total: updatedQuote.total } });

      // Reload everything to get the fresh items correctly from DB
      await loadQuotes();

      dispatch({ type: "CLOSE_EDIT_MODAL" });
      Swal.fire({
        title: "¡Actualizada!",
        text: "La solicitud fue actualizada.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo actualizar.",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      dispatch({ type: "SET_SAVING_EDIT", payload: false });
    }
  };

  const handleQuoteDecision = async (quote, nextStatus) => {
    if (!nextStatus) return;

    const isAccepting = nextStatus === "ACEPTADA";
    const result = await Swal.fire({
      title: isAccepting ? "¿Aceptar cotización?" : "¿Rechazar cotización?",
      text: isAccepting
        ? "El administrador será notificado de tu aceptación."
        : "El administrador será notificado de tu rechazo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isAccepting ? "#059669" : "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: isAccepting ? "Sí, aceptar" : "Sí, rechazar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setRespondingQuoteId(quote.id);
    try {
      if (isAccepting) {
        await acceptPortalQuoteApi(quote.id);
      } else {
        await rejectPortalQuoteApi(quote.id);
      }

      dispatch({
        type: "UPDATE_QUOTE_STATUS",
        payload: { id: quote.id, status: nextStatus },
      });

      Swal.fire({
        title: isAccepting ? "Cotización aceptada" : "Cotización rechazada",
        text: "Tu respuesta fue enviada correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo enviar tu respuesta.",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setRespondingQuoteId(null);
    }
  };

  const displayedQuotes = useMemo(() => {
    const now = PORTAL_QUOTES_RENDER_NOW;
    return quotes.filter((q) => {
      const computedStatus = getQuoteDisplayStatus(q);

      if (statusFilter && computedStatus !== statusFilter) return false;
      const isRecent = now - new Date(q.created_at).getTime() <= WEEK_MS;
      if (filter === "recent" && !isRecent) return false;
      if (filter !== "recent" && isRecent) return false;
      return true;
    });
  }, [quotes, statusFilter, filter]);

  // Cálculos de Paginación
  const totalItems = displayedQuotes.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentQuotes = displayedQuotes.slice(startIndex, endIndex);
  const isTableScrollable = currentQuotes.length > 5;

  return (
    <div className="space-y-6">
      <PortalHeader
        filter={filter}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) =>
          dispatch({ type: "SET_STATUS_FILTER", payload: value })
        }
      />

      {loading ? (
        <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">Cargando\u2026</div>
      ) : error ? (
        <div role="alert" className="text-center text-red-700 dark:text-red-300 py-12 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      ) : displayedQuotes.length === 0 ? (
        <div className="bg-white/60 dark:bg-zinc-900/70 p-12 text-center rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="flex justify-center mb-4">
            <FolderOpen size={48} className="text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            {filter === "recent"
              ? "No tienes cotizaciones de los últimos 7 días."
              : "No tienes cotizaciones con más de 7 días."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm dark:shadow-black/20 overflow-hidden">
          <div className={`overflow-x-auto ${isTableScrollable ? "max-h-[420px] overflow-y-auto" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className={`bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${isTableScrollable ? "sticky top-0 z-20" : ""}`}>
                <tr>
                  <th className="p-4">Cotización</th>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Fecha Final</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {currentQuotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onEdit={(q) => dispatch({ type: "OPEN_EDIT_MODAL", payload: q })}
                    onDelete={handleDelete}
                    onDecision={handleQuoteDecision}
                    respondingQuoteId={respondingQuoteId}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSize={pageSize}
            dispatch={dispatch}
          />
        </div>
      )}

      <EditQuoteModal
        editingQuote={editingQuote}
        editItems={editItems}
        savingEdit={savingEdit}
        dispatch={dispatch}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
