import {
  BadgeDollarSign,
  Building2,
  CheckCircle2,
} from "@icons";

export default function GeneratedQuoteView({
  generatedQuote,
  formatCurrency,
  formatDateTime,
  getQuoteStatusLabel,
  navigate,
  startNewQuote,
  clampDiscount,
}) {
  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <section className="relative overflow-hidden rounded-[28px] border border-[#1A4577]/20 bg-gradient-to-r from-[#0E2B56] via-[#154782] to-[#123A72] px-6 md:px-8 py-7 md:py-8 text-white shadow-[0_28px_90px_rgba(8,28,64,0.35)]">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-8 size-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/15 ring-1 ring-white/25">
              <CheckCircle2 size={30} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-100/95 tracking-wide uppercase">
                Cotización confirmada
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                Cotización generada exitosamente
              </h1>
              <p className="text-sm text-blue-100/90 mt-2 max-w-2xl">
                La interfaz de captura fue reemplazada por el documento final
                para revisión y siguientes acciones.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/10 ring-1 ring-white/20 p-3 min-w-[270px]">
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-semibold">
                Folio
              </p>
              <p className="text-sm font-mono font-bold text-white truncate">
                {generatedQuote.folio}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-semibold">
                Estado
              </p>
              <p className="text-sm font-bold text-white">
                {getQuoteStatusLabel(generatedQuote.status)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-semibold">
                Fecha de generación
              </p>
              <p className="text-sm font-semibold text-white">
                {formatDateTime(generatedQuote.created_at)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 size={15} /> Cliente
              </h3>
              <p className="text-2xl font-bold text-zinc-800 leading-tight">
                {generatedQuote.client.business_name}
              </p>
              <p className="text-sm text-zinc-500 font-mono mt-1">
                {generatedQuote.client.rfc}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Contacto
              </h3>
              {generatedQuote.contact ?
                <>
                  <p className="text-xl font-bold text-zinc-800 leading-tight">
                    {generatedQuote.contact.full_name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {generatedQuote.contact.position_title}
                  </p>
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1">
                    <p className="text-sm text-zinc-700 break-all">
                      {generatedQuote.contact.email}
                    </p>
                    <p className="text-sm text-zinc-700">
                      {generatedQuote.contact.phone}
                    </p>
                  </div>
                </>
              : <div className="min-h-[110px] flex items-center">
                  <p className="text-sm text-zinc-500 font-medium">
                    Sin contacto asignado.
                  </p>
                </div>
              }
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  Partidas cotizadas
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {generatedQuote.items.reduce(
                    (acc, item) => acc + item.quantity,
                    0,
                  )}{" "}
                  productos en total
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-600">
                {generatedQuote.items.length} partida(s)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="bg-white border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Unitario</th>
                    <th className="px-4 py-3 text-right">Desc.</th>
                    <th className="px-4 py-3 text-right">Unitario c/desc</th>
                    <th className="px-5 py-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {generatedQuote.items.map((item, index) => (
                    <tr key={item.tempId || `${item.name}-${index}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-zinc-800">
                          {item.name}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                        ${formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                        {clampDiscount(item.discount).toLocaleString("es-MX", {
                          maximumFractionDigits: 2,
                        })}
                        %
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[#2277B4] font-semibold">
                        ${formatCurrency(item.discounted_unit_price)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-zinc-800">
                        ${formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5 xl:sticky xl:top-24">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BadgeDollarSign size={16} /> Resumen financiero
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                <span>Subtotal bruto</span>
                <span className="font-mono text-zinc-800">
                  ${formatCurrency(generatedQuote.grossSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                <span>Descuento</span>
                <span className="font-mono text-rose-600">
                  -${formatCurrency(generatedQuote.totalDiscount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                <span>Subtotal neto</span>
                <span className="font-mono text-zinc-800">
                  ${formatCurrency(generatedQuote.grandTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                <span>IVA (16%)</span>
                <span className="font-mono text-zinc-800">
                  ${formatCurrency(generatedQuote.ivaTotal)}
                </span>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-base font-bold text-zinc-800">
                  Total Neto
                </span>
                <span className="text-2xl font-bold text-[#1a2b4c] font-mono tracking-tight">
                  ${formatCurrency(generatedQuote.totalWithIva)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-[#F6FAFF] border border-[#D9E9FA] text-xs text-zinc-600 leading-relaxed">
              Este documento ya fue registrado y se encuentra listo para
              seguimiento comercial.
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Cotización generada por un total de
          <span className="font-bold text-zinc-800">
            {" "}
            ${formatCurrency(generatedQuote.totalWithIva)}
          </span>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {generatedQuote.id && (
            <button
              onClick={() => navigate(`/cotizaciones/${generatedQuote.id}`)}
              className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold transition-colors">
              Ver detalle
            </button>
          )}
          <button
            onClick={() => navigate("/cotizaciones/historial")}
            className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold transition-colors">
            Ir al historial
          </button>
          <button
            onClick={startNewQuote}
            className="px-5 py-2 rounded-xl bg-[#2277B4] hover:bg-[#125280] text-white font-bold transition-colors">
            Nueva cotización
          </button>
        </div>
      </section>
    </div>
  );
}
