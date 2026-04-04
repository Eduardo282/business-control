import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, FolderOpen, Clock, History } from "@icons";
import { listQuotesApi } from "../../actionsAPI/quotes.api";

// Umbral: 7 días en milisegundos
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function PortalQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  // Lee el filtro desde la URL: ?filter=recent | ?filter=older  (default: recent)
  const filter = searchParams.get("filter") || "recent";

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listQuotesApi();
      setQuotes(data);
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.errors?.[0]?.message ||
        e.message ||
        "Error al cargar cotizaciones";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const now = Date.now();

  const recentQuotes = quotes.filter(
    (q) => now - new Date(q.created_at).getTime() <= WEEK_MS,
  );

  const olderQuotes = quotes.filter(
    (q) => now - new Date(q.created_at).getTime() > WEEK_MS,
  );

  const displayedQuotes = filter === "recent" ? recentQuotes : olderQuotes;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {filter === "recent" ?
            <>
              <Clock size={24} className="text-black" /> Cotizaciones
              Recientes
            </>
          : <>
              <History size={24} className="text-black" /> Cotizaciones
            </>
          }
        </h2>
        <span className="text-sm text-gray-400">
          {displayedQuotes.length} resultado
          {displayedQuotes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ?
        <div className="text-center text-gray-500 py-12">Cargando...</div>
      : error ?
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      : displayedQuotes.length === 0 ?
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
      : <div className="grid gap-4">
          {displayedQuotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                  <FileText size={20} className="text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-lg">
                    Cotización #{quote.id}
                  </div>
                  <div className="text-sm text-gray-500">
                    Fecha: {new Date(quote.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Total
                  </div>
                  <div className="font-mono font-bold text-emerald-600 text-lg">
                    $
                    {Number(quote.total).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <StatusBadge status={quote.status} />
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200",
    ACCEPTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
  };

  const labels = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
        styles[status] || "bg-gray-50 text-gray-500 border-gray-200"
      }`}>
      {labels[status] || status}
    </span>
  );
}
