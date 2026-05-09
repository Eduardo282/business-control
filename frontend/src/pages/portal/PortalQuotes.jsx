import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, FolderOpen, Clock, History, ExternalLink, Trash2, Edit2, X, Plus, Minus, Search } from "@icons";
import { listPortalQuotesApi, deletePortalQuoteApi, updatePortalQuoteRequestApi } from "../../actionsAPI/portal.api";
import Swal from "sweetalert2";

export default function PortalQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "recent";
  
  const [statusFilter, setStatusFilter] = useState("");
  
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal Edit state
  const [editingQuote, setEditingQuote] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, filter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPortalQuotesApi();
      setQuotes(data);
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.errors?.[0]?.message || e.message || "Error al cargar cotizaciones";
      setError(msg);
    } finally {
      setLoading(false);
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
      setQuotes((prev) => prev.filter((q) => String(q.id) !== String(id)));
      
      // Ajustar página si se elimina el último elemento
      if (currentQuotes.length === 1 && page > 1) {
        setPage(p => p - 1);
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

  const openEditModal = (quote) => {
    setEditingQuote(quote);
    // Copy items deeply
    setEditItems(quote.items.map(i => ({ ...i })));
  };

  const closeEditModal = () => {
    setEditingQuote(null);
    setEditItems([]);
  };

  const handleEditQuantity = (itemId, change) => {
    setEditItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQ = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const payload = editItems.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity
      }));
      
      const updatedQuote = await updatePortalQuoteRequestApi(editingQuote.id, payload);
      
      setQuotes(prev => prev.map(q => {
        if (q.id === updatedQuote.id) {
          // Actualizamos total y recargamos items
          return { ...q, total: updatedQuote.total }; 
        }
        return q;
      }));
      
      // Reload everything to get the fresh items correctly from DB
      await load();
      
      closeEditModal();
      Swal.fire({
        title: "¡Actualizada!",
        text: "La solicitud fue actualizada.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch(e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo actualizar.",
        icon: "error",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const displayedQuotes = quotes.filter((q) => {
    // Filtro por estado
    if (statusFilter && q.status !== statusFilter) return false;
    
    // Filtro por fecha (recent = <= 7 días, older = > 7 días)
    const isRecent = now - new Date(q.created_at).getTime() <= WEEK_MS;
    if (filter === "recent" && !isRecent) return false;
    if (filter !== "recent" && isRecent) return false;

    return true;
  });

  // Cálculos de Paginación
  const totalItems = displayedQuotes.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentQuotes = displayedQuotes.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-700 shadow-sm appearance-none"
            >
              <option value="">Todos los Estados</option>
              <option value="REQUESTED">Solicitada</option>
              <option value="PENDING">Pendiente </option>
              <option value="ACCEPTED">Aceptada </option>
              <option value="REJECTED">Rechazada </option>
              <option value="SENT">Enviada </option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
               <Search size={14} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      ) : displayedQuotes.length === 0 ? (
        <div className="bg-white/60 p-12 text-center rounded-2xl border-2 border-dashed border-gray-300">
          <div className="flex justify-center mb-4">
            <FolderOpen size={48} className="text-gray-300" />
          </div>
          <p className="text-gray-500">
            {filter === "recent" ?
              "No tienes cotizaciones de los últimos 7 días."
            : "No tienes cotizaciones con más de 7 días."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Cotización</th>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                          <FileText size={16} className="text-emerald-600" />
                        </div>
                        <div className="font-bold text-gray-800 text-base">
                          Cotización #{quote.id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-mono font-bold text-[#2277B4] tracking-wider">
                        {quote.folio || "—"}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono font-bold text-emerald-600 text-base">
                        $
                        {(Number(quote.total) * 1.16).toLocaleString("es-MX", {
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1a2b4c] bg-white rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors"
                        >
                          <ExternalLink size={14} /> Ver
                        </Link>
                        
                        {(quote.status === "REQUESTED" || quote.status === "PENDING") && (
                          <>
                            <button
                              onClick={() => openEditModal(quote)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                              title="Editar cantidades"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(quote.id)}
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
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Controles de Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 bg-gray-50 gap-4">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-bold text-gray-700">{totalItems === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-gray-700">{totalItems}</span> cotizaciones
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-700 shadow-sm appearance-none relative"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap min-w-[70px] text-center">
                  Pág. {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1a2b4c] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                Editar Cotización #{editingQuote.id}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Ajusta las cantidades de los productos en tu solicitud. 
              </p>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {editItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-semibold text-gray-800 text-sm truncate" title={item.product?.name}>
                        {item.product?.name}
                      </h4>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Precio Unitario (aprox): ${Number(item.total / item.quantity || 0).toLocaleString('es-MX')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEditQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-mono font-bold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleEditQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {savingEdit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
      className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide border inline-flex ${
        styles[status] || "bg-gray-50 text-gray-500 border-gray-200"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
