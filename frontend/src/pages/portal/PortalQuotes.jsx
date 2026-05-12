import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, FolderOpen, Clock, History, ExternalLink, Trash2, Edit2, X, Plus, Minus, Search } from "@icons";
import { listPortalQuotesApi, deletePortalQuoteApi, updatePortalQuoteRequestApi } from "../../actionsAPI/portal.api";
import Swal from "sweetalert2";

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

const initialState = {
  quotes: [],
  loading: true,
  error: "",
  statusFilter: "",
  page: 1,
  pageSize: 10,
  editingQuote: null,
  editItems: [],
  savingEdit: false,
};

/* ── Sub-components ──────────────────────────────────────── */

function StatusBadge({ status }) {
  const styles = {
    REQUESTED: "bg-blue-50 text-blue-600 border-blue-200",
    PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200",
    ACCEPTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
    SENT: "bg-purple-50 text-purple-600 border-purple-200",
  };

  const labels = {
    REQUESTED: "Solicitada",
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
    SENT: "Enviada",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-semibold tracking-wide border inline-flex ${
        styles[status] || "bg-zinc-50 text-zinc-500 border-zinc-200"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function PortalHeader({ filter, statusFilter, onStatusFilterChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <h2 className="text-2xl font-semibold text-zinc-800 flex items-center gap-2">
        {filter === "recent" ? (
          <>
            <Clock size={24} className="text-black" /> Cotizaciones Recientes
          </>
        ) : (
          <>
            <History size={24} className="text-black" /> Historial de Cotizaciones
          </>
        )}
      </h2>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="pl-3 pr-8 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-700 shadow-sm appearance-none"
          >
            <option value="">Todos los Estados</option>
            <option value="REQUESTED">Solicitada</option>
            <option value="PENDING">Pendiente </option>
            <option value="ACCEPTED">Aceptada </option>
            <option value="REJECTED">Rechazada </option>
            <option value="SENT">Enviada </option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
             <Search size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteRow({ quote, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
            <FileText size={16} className="text-emerald-600" />
          </div>
          <div className="font-semibold text-zinc-800 text-base">
            Cotización #{quote.id}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm font-mono font-semibold text-[#2277B4] tracking-wider">
          {quote.folio || "—"}
        </div>
      </td>
      <td className="p-4 text-zinc-600" suppressHydrationWarning>
        {new Date(quote.created_at).toLocaleDateString()}
      </td>
      <td className="p-4 text-right">
        <div className="font-mono font-semibold text-emerald-600 text-base">
          $
          {Number(quote.total).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}
        </div>
      </td>
      <td className="p-4 text-center">
        <StatusBadge status={quote.status} />
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/portal/quotes/${quote.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1a2b4c] bg-white rounded-lg border border-zinc-200 hover:bg-zinc-50 shadow-sm transition-colors"
          >
            <ExternalLink size={14} /> Ver
          </Link>

          {(quote.status === "REQUESTED" || quote.status === "PENDING") && (
            <>
              <button
                onClick={() => onEdit(quote)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                title="Editar cantidades"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(quote.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                title="Eliminar solicitud"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function PaginationControls({ page, totalPages, totalItems, startIndex, endIndex, pageSize, dispatch }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-zinc-100 bg-zinc-50 gap-4">
      <div className="text-sm text-zinc-500">
        Mostrando <span className="font-semibold text-zinc-700">{totalItems === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-semibold text-zinc-700">{totalItems}</span> cotizaciones
      </div>

      <div className="flex items-center gap-4">
        <select
          value={pageSize}
          onChange={(e) => dispatch({ type: "SET_PAGE_SIZE", payload: Number(e.target.value) })}
          className="pl-3 pr-8 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-700 shadow-sm appearance-none relative"
        >
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: Math.max(1, page - 1) })}
            disabled={page === 1}
            className="size-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-zinc-500 font-medium whitespace-nowrap min-w-[70px] text-center">
            Pág. {page} / {totalPages}
          </span>
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: Math.min(totalPages, page + 1) })}
            disabled={page === totalPages}
            className="size-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditQuoteModal({ editingQuote, editItems, savingEdit, dispatch, onSave }) {
  if (!editingQuote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Editar Cotización #{editingQuote.id}
          </h3>
          <button
            onClick={() => dispatch({ type: "CLOSE_EDIT_MODAL" })}
            className="text-zinc-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-500 mb-4">
            Ajusta las cantidades de los productos en tu solicitud.
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {editItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-zinc-200 rounded-xl bg-zinc-50">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-semibold text-zinc-800 text-sm truncate" title={item.product?.name}>
                    {item.product?.name}
                  </h4>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Precio Unitario (aprox): ${Number(item.total / item.quantity || 0).toLocaleString('es-MX')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => dispatch({ type: "UPDATE_EDIT_QUANTITY", payload: { itemId: item.id, change: -1 } })}
                    className="size-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-semibold w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => dispatch({ type: "UPDATE_EDIT_QUANTITY", payload: { itemId: item.id, change: 1 } })}
                    className="size-8 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              onClick={() => dispatch({ type: "CLOSE_EDIT_MODAL" })}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
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
  const { quotes, loading, error, statusFilter, page, pageSize, editingQuote, editItems, savingEdit } = state;

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await listPortalQuotesApi();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.errors?.[0]?.message || e.message || "Error al cargar cotizaciones";
      dispatch({ type: "FETCH_ERROR", payload: msg });
    }
  };

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
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo eliminar.",
        icon: "error",
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
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo actualizar.",
        icon: "error",
      });
    } finally {
      dispatch({ type: "SET_SAVING_EDIT", payload: false });
    }
  };

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const displayedQuotes = useMemo(() => {
    const now = Date.now();
    return quotes.filter((q) => {
      if (statusFilter && q.status !== statusFilter) return false;
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

  return (
    <div className="space-y-6">
      <PortalHeader
        filter={filter}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => dispatch({ type: "SET_STATUS_FILTER", payload: v })}
      />

      {loading ? (
        <div className="text-center text-zinc-500 py-12">Cargando\u2026</div>
      ) : error ? (
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      ) : displayedQuotes.length === 0 ? (
        <div className="bg-white/60 p-12 text-center rounded-2xl border-2 border-dashed border-zinc-300">
          <div className="flex justify-center mb-4">
            <FolderOpen size={48} className="text-zinc-300" />
          </div>
          <p className="text-zinc-500">
            {filter === "recent"
              ? "No tienes cotizaciones de los últimos 7 días."
              : "No tienes cotizaciones con más de 7 días."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Cotización</th>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentQuotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onEdit={(q) => dispatch({ type: "OPEN_EDIT_MODAL", payload: q })}
                    onDelete={handleDelete}
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
