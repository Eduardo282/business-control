import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Package, X } from "@icons";
import { formatSaleDateTime, formatSaleMoney, getSaleProductsSummary } from "./usePolicies";

export function StatCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-[#2277B4] dark:bg-blue-500/10 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {helper}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone] || tones.blue}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function SaleSummaryModal({ sale, onClose, onCreateSale, creatingSale }) {
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  useEffect(() => {
    setSelectedItemIds([]);
  }, [sale?.id]);

  if (!sale) return null;

  const summary = getSaleProductsSummary(sale);
  const items = sale.items || [];
  const canCreateSale = sale.status === "ACEPTADA";
  const selectedCount = selectedItemIds.length;

  const toggleItem = (itemId) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const handleCreateSelected = () => {
    if (!selectedCount) return;
    onCreateSale?.(sale, selectedItemIds);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-dark-700 dark:bg-dark-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-[#1a2b4c] px-6 py-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">
              Resumen de cotización
            </p>
            <h2 className="mt-2 text-2xl font-bold">Cotización #{sale.id}</h2>
            <code className="mt-2 inline-flex rounded-md bg-white/10 px-2 py-1 font-mono text-xs font-bold text-blue-100">
              {sale.folio || "Sin folio"}
            </code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-white transition-colors hover:bg-white/10"
            aria-label="Cerrar resumen de cotización"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {canCreateSale && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Crear venta
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-100">
                  Selecciona uno o más productos aceptados para generar la venta.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateSelected}
                disabled={creatingSale || selectedCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                <Package size={16} />
                {creatingSale
                  ? "Generando..."
                  : `Vender seleccionados (${selectedCount})`}
              </button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Cliente
              </p>
              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {sale.client?.business_name || "Sin cliente"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Contacto
              </p>
              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {sale.contact?.full_name || "Sin contacto"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {sale.contact?.email || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Total
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {formatSaleMoney(sale.total)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Fecha de cotización
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {formatSaleDateTime(sale.registered_at || sale.created_at)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-dark-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Productos cotizados
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {summary.detail}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-dark-700">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-dark-700">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Detalle de productos
              </p>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-dark-700">
              {items.length === 0 ? (
                <div className="px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin productos registrados en esta cotización.
                </div>
              ) : (
                items.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`grid gap-3 px-4 py-3 text-sm ${
                        canCreateSale
                          ? "md:grid-cols-[auto_1fr_auto_auto_auto]"
                          : "md:grid-cols-[1fr_auto_auto]"
                      }`}
                    >
                      {canCreateSale && (
                        <label className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.id)}
                            className="size-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-500"
                            aria-label={`Seleccionar ${item.product?.name || "producto"}`}
                          />
                        </label>
                      )}
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {item.product?.name || "Producto sin nombre"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.product?.folio || item.product?.category || "—"}
                        </p>
                      </div>
                      <div className="space-y-1 text-zinc-600 dark:text-zinc-300">
                        <p>
                          Cantidad: <span className="font-bold">{item.quantity || 1}</span>
                        </p>
                        <p>
                          Descuento:{" "}
                          <span className="font-bold text-amber-600 dark:text-amber-300">
                            {Number(item.discount || 0).toLocaleString("es-MX", {
                              maximumFractionDigits: 2,
                            })}
                            %
                          </span>
                        </p>
                      </div>
                      <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {formatSaleMoney(item.total)}
                      </div>
                      {canCreateSale && (
                        <button
                          type="button"
                          onClick={() => onCreateSale?.(sale, [item.id])}
                          disabled={creatingSale}
                          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/20 dark:bg-dark-900 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                        >
                          Vender
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
