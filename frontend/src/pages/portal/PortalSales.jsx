import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, FolderOpen, Search, Trash2, X } from "@icons";
import {
  deletePortalSaleApi,
  listPortalSalesApi,
} from "../../actionsAPI/portal.api";
import Swal from "sweetalert2";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX");
}

function getProductsSummary(sale) {
  const items = sale.items || [];
  if (!items.length) return "Sin productos";
  const names = items.map((item) => item.product?.name).filter(Boolean);
  const visible = names.slice(0, 2).join(", ");
  const hidden = Math.max(0, names.length - 2);
  return hidden > 0 ? `${visible} +${hidden}` : visible;
}

export default function PortalSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    listPortalSalesApi()
      .then((data) => {
        if (!canceled) setSales(data || []);
      })
      .catch((err) => {
        if (!canceled) setError(err.message || "Error al cargar ventas");
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  const filteredSales = useMemo(() => {
    const search = q.trim().toLowerCase();
    if (!search) return sales;
    return sales.filter((sale) =>
      [sale.id, sale.folio, sale.quote?.folio, getProductsSummary(sale)]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [q, sales]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar venta?",
      text: "Esta venta se eliminará de tu portal.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;

    try {
      await deletePortalSaleApi(id);
      setSales((current) => current.filter((sale) => String(sale.id) !== String(id)));
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudo eliminar la venta.",
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
          <FileText size={24} className="text-black dark:text-zinc-100" /> Ventas
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" size={16} />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar ventas..."
            className="w-64 rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-8 text-sm text-zinc-700 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-black/20"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="p-4">Venta</th>
              <th className="p-4">Cotización</th>
              <th className="p-4">Productos</th>
              <th className="p-4">Fecha</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td className="p-8 text-center text-zinc-500" colSpan={6}>
                  Cargando ventas...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td className="p-12 text-center text-zinc-500" colSpan={6}>
                  <div className="flex flex-col items-center gap-3">
                    <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm font-medium">No tienes ventas disponibles.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/70">
                  <td className="p-4">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                      Venta #{sale.id}
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#2277B4] dark:text-blue-400">
                      {sale.folio || "—"}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {sale.quote?.folio || `#${sale.quote?.id || "—"}`}
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">
                    {getProductsSummary(sale)}
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300">
                    {formatDate(sale.created_at)}
                  </td>
                  <td className="p-4 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatMoney(sale.total)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/portal/sales/${sale.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1a2b4c] shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-300 dark:hover:bg-zinc-800"
                      >
                        <ExternalLink size={14} /> Ver
                      </Link>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
