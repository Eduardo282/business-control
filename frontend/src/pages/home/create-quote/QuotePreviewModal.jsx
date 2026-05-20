import { createPortal } from "react-dom";
import { BadgeDollarSign, Building2, X } from "@icons";

export default function QuotePreviewModal({
  isOpen,
  onClose,
  selectedClient,
  selectedContact,
  folio,
  items,
  totals,
  clampDiscount,
  calculateDiscountedUnitPrice,
  onSave,
  loading,
}) {
  if (!isOpen) return null;

  const {
    grossSubtotal,
    totalDiscount,
    grandTotal,
    ivaTotal,
    totalWithIva,
  } = totals;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/65 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-dark-900 shadow-[0_30px_120px_rgba(8,20,45,0.45)] flex flex-col">
        <div className="px-6 md:px-7 py-4 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-[#102445] via-[#0F2B5A] to-[#0A1F43] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl ring-1 ring-white/20">
              <BadgeDollarSign size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Vista Previa de Cotización
              </h2>
              <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                Resumen total y confirmación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-9 flex items-center justify-center rounded-xl hover:bg-white/20 ring-1 ring-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-7 py-6 bg-gradient-to-b from-zinc-100/70 via-white to-zinc-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 size={16} /> Cliente
                  </h3>
                  <div className="space-y-1">
                    <p className="text-2xl xl:text-3xl leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                      {selectedClient?.business_name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {selectedClient?.rfc || "Sin RFC"}
                    </p>
                    {folio && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-dark-700">
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                          Folio
                        </p>
                        <p className="text-sm font-mono font-bold text-[#2277B4] dark:text-blue-400 tracking-widest">
                          {folio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
                    Contacto
                  </h3>
                  {selectedContact ?
                    <div className="space-y-1">
                      <p className="text-xl leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                        {selectedContact.full_name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {selectedContact.position_title || "Sin puesto"}
                      </p>
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-dark-700 space-y-1">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 break-all">
                          {selectedContact.email || "Sin correo"}
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {selectedContact.phone || "Sin telefono"}
                        </p>
                      </div>
                    </div>
                  : <div className="h-full min-h-[112px] flex items-center">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Sin contacto asignado para esta cotización.
                      </p>
                    </div>
                  }
                </div>

                <div className="md:col-span-2 bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Productos
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium gap-3">
                      <span>Productos en total:</span>
                      <span className="text-zinc-800 dark:text-zinc-100 font-bold whitespace-nowrap">
                        {items.reduce((acc, item) => acc + item.quantity, 0)}{" "}
                        productos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-zinc-200/80 dark:border-dark-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-zinc-50 dark:bg-dark-900 border-b border-zinc-100 dark:border-dark-700 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Productos Cotizados</span>
                </div>
                <div className="max-h-[42vh] overflow-y-auto divide-y divide-zinc-100 dark:divide-dark-700">
                  {items.map((i, index) => (
                    <div
                      key={i.tempId}
                      className="flex justify-between items-start gap-4 px-5 py-3.5 hover:bg-zinc-50/80 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="size-6 mt-0.5 inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-dark-700 text-zinc-500 dark:text-zinc-300 font-mono text-xs shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                            {i.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {i.quantity} uds x $
                            {i.price.toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                            {clampDiscount(i.discount || 0) > 0 &&
                              ` · Desc ${clampDiscount(i.discount || 0).toLocaleString("es-MX", {
                                maximumFractionDigits: 2,
                              })}%`}
                          </p>
                          {clampDiscount(i.discount || 0) > 0 && (
                            <p className="text-[11px] text-[#2277B4] dark:text-blue-400 mt-0.5 font-medium">
                              Unitario c/desc: $
                              {calculateDiscountedUnitPrice(
                                i.price,
                                i.discount || 0,
                              ).toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
                          Importe
                        </p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-mono">
                          $
                          {i.total.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm xl:sticky xl:top-1">
                <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
                  Resumen financiero
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>Subtotal bruto</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-100">
                      ${Number(grossSubtotal || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>Descuento</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      -${Number(totalDiscount || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>Subtotal neto</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-100">
                      ${Number(grandTotal || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>IVA (16%)</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-100">
                      ${Number(ivaTotal || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-dark-700">
                    <span className="font-bold text-zinc-800 dark:text-zinc-100 text-base">
                      Total Neto
                    </span>
                    <span className="font-bold text-2xl text-[#1a2b4c] dark:text-emerald-400 font-mono tracking-tight">
                      ${Number(totalWithIva || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-7 py-4 bg-white/95 dark:bg-dark-900 border-t border-zinc-200 dark:border-dark-700 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-dark-800 font-bold transition-all">
            Volver a editar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-8 py-3 bg-[#2277B4] hover:bg-[#125280] shadow-lg shadow-[#2277B430] text-white rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading ? "Procesando…" : "Confirmar y Generar Cotización"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
