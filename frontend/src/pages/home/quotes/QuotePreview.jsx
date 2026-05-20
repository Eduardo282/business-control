import { calculateQuotePricing } from "@shared/quotePricingRules.js";

export default function QuotePreview({
  quote,
  quoteFolio,
  quoteDateLabel,
  quoteValidityLabel,
  innerRef,
}) {
  const quoteItems = Array.isArray(quote.items) ? quote.items : [];
  const quotePricing = calculateQuotePricing({ items: quoteItems });
  const grossSubtotal = quotePricing.grossSubtotal;
  const netSubtotal = quotePricing.subtotal;
  const totalDiscount = quotePricing.totalDiscount;
  const ivaAmount = quotePricing.iva;
  const totalNeto = quotePricing.total;

  return (
    <div
      data-export-preview="quote"
      ref={innerRef}
      className="mx-auto max-w-5xl bg-white dark:bg-dark-900 text-zinc-900 dark:text-zinc-100 shadow-2xl print:shadow-none print:w-full print:m-0 animate-slide-up origin-top border border-zinc-200 dark:border-dark-700 rounded-2xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-[#0f274d] via-[#154982] to-[#1d6fb3] text-white px-8 md:px-12 py-3 flex items-center justify-between text-xs tracking-wide uppercase font-semibold print:bg-white print:text-zinc-900 print:border-b print:border-zinc-200">
        <span>Business Control | Documento Comercial</span>
      </div>

      <div className="p-8 md:p-12 border-b border-zinc-100 dark:border-dark-700">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              COTIZACIÓN
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Propuesta comercial formal para revisión y aprobación.
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Business Control
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Av. Vallarta #1234, Col. Americana
              <br />
              Guadalajara, Jalisco, CP 44100
              <br />
              ventas@businesscontrol.com
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              Folio
            </p>
            <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {quoteFolio}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              Fecha de Emisión
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              {quoteDateLabel}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              Vigencia
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              {quoteValidityLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-12 py-8 bg-zinc-50/60 dark:bg-dark-800/40 border-b border-zinc-100 dark:border-dark-700">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Cliente asignado
            </h3>
            <div className="font-bold text-xl text-zinc-900 dark:text-zinc-100 leading-tight">
              {quote.client?.business_name || "Cliente eliminado"}
            </div>
            <div className="text-zinc-600 dark:text-zinc-300 text-sm mt-2 space-y-1">
              <div>{quote.client?.address || "Domicilio no registrado"}</div>
              <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                RFC: {quote.client?.rfc || "XAXX010101000"}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-dark-700">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Contacto asignado
              </h4>
              {quote.contact ? (
                <div className="text-zinc-600 dark:text-zinc-300 text-sm space-y-1">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {quote.contact.full_name}
                  </div>
                  <div>{quote.contact.position_title || "Sin puesto"}</div>
                  <div>{quote.contact.email || "Sin correo"}</div>
                  <div>{quote.contact.phone || "Sin teléfono"}</div>
                </div>
              ) : (
                <div className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Sin contacto asignado
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Ejecutivo de Ventas
            </h3>
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
              {quote.user?.full_name || "Usuario eliminado"}
            </div>
            <div className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">
              {quote.user?.email || "Sin correo"}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-dark-700 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <div>Canal: Atención comercial directa</div>
              <div>Moneda: MXN</div>
              <div>Impuesto aplicado: IVA 16%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-12 py-8 min-h-[280px]">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-zinc-900 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-6 bg-zinc-900 text-white rounded-l-lg">
                Descripción / Producto
              </th>
              <th className="py-3 px-4 text-center bg-zinc-900 text-white">Cant</th>
              <th className="py-3 px-4 text-right bg-zinc-900 text-white">Precio Lista</th>
              <th className="py-3 px-4 text-right bg-zinc-900 text-white">Desc.</th>
              <th className="py-3 px-4 text-right bg-zinc-900 text-white">Precio Unit.</th>
              <th className="py-3 px-6 text-right bg-zinc-900 text-white rounded-r-lg">
                Importe
              </th>
            </tr>
          </thead>
          <tbody>
            {quoteItems.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const baseUnitPrice =
                Number(item.base_unit_price || item.unit_price || item.price) || 0;
              const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
              const discountedUnitPrice = Number(item.unit_price || item.price) || 0;
              const lineTotal = Number(item.total) || discountedUnitPrice * quantity;

              return (
                <tr
                  key={item.id}
                  className={`${
                    index % 2 === 0 ? "bg-white dark:bg-dark-900" : "bg-zinc-50/70 dark:bg-dark-800/70"
                  } border-b border-zinc-100 dark:border-dark-700`}
                >
                  <td className="py-4 pl-6 pr-4 align-top">
                    <div className="font-bold text-zinc-800 dark:text-zinc-100 text-base leading-tight">
                      {item.product?.name || "Producto eliminado"}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {item.product?.description || item.product?.category}
                      {item.product?.users_count > 0 && (
                        <span className="ml-2 inline-block text-[10px] bg-zinc-100 dark:bg-dark-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-dark-700">
                          {item.product?.users_count} Usuario(s)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-300 align-top font-mono">
                    {quantity}
                  </td>
                  <td className="py-4 px-4 text-right text-zinc-600 dark:text-zinc-300 align-top font-mono">
                    $
                    {baseUnitPrice.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={`py-4 px-4 text-right align-top font-mono ${
                      discount > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {discount.toLocaleString("es-MX", {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </td>
                  <td className="py-4 px-4 text-right text-zinc-600 dark:text-zinc-300 align-top font-mono">
                    $
                    {discountedUnitPrice.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right font-bold text-zinc-900 dark:text-zinc-100 align-top font-mono">
                    $
                    {lineTotal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-8 md:px-12 pb-8 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-dark-700 bg-zinc-50/70 dark:bg-dark-800/70 p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Condiciones Comerciales
          </h4>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li>1. Esta propuesta tiene vigencia hasta el {quoteValidityLabel}.</li>
            <li>2. Los precios se expresan en MXN e incluyen descuentos aplicados por partida.</li>
            <li>3. El tiempo de entrega queda sujeto a disponibilidad y confirmación de inventario.</li>
            <li>4. Cualquier ajuste posterior deberá formalizarse mediante actualización de cotización.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-5 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
            Resumen Financiero
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-sm">
              <span>Subtotal bruto</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                $
                {grossSubtotal.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-sm">
              <span>Descuento</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                -$
                {totalDiscount.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-sm">
              <span>Subtotal neto</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                $
                {netSubtotal.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-sm">
              <span>IVA (16%)</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                $
                {ivaAmount.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-end border-t border-zinc-900 dark:border-zinc-100 pt-3 mt-3">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Total Neto</span>
              <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 text-2xl">
                $
                {totalNeto.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="px-8 md:px-12 pb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Notas Adicionales
          </h4>
          <div className="bg-zinc-50 dark:bg-dark-800 p-4 rounded-xl text-sm text-zinc-600 dark:text-zinc-300 italic border border-zinc-200 dark:border-dark-700">
            {quote.notes}
          </div>
        </div>
      )}

      <div className="px-8 md:px-12 pb-8 grid md:grid-cols-2 gap-6 text-sm text-zinc-600 dark:text-zinc-300">
        <div className="rounded-xl border border-zinc-200 dark:border-dark-700 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-8">
            Aceptación del Cliente
          </p>
          <div className="border-t border-zinc-400 dark:border-zinc-600 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Nombre y firma
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-dark-700 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-8">
            Ejecutivo Responsable
          </p>
          <div className="border-t border-zinc-400 dark:border-zinc-600 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {quote.user?.full_name || "Sin asignar"}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 text-white p-8 md:p-12 text-xs border-t border-zinc-100 print:bg-white print:text-black print:border-t-2 print:border-black">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h4 className="font-bold mb-1 uppercase text-emerald-400 print:text-black">
              Información de Pago
            </h4>
            <p className="leading-relaxed text-zinc-400 print:text-zinc-600">
              Banco: BBVA Bancomer
              <br />
              Cuenta: 0123456789
              <br />
              CLABE: 012000001234567890
              <br />
              Beneficiario: Business Control S.A. de C.V.
            </p>
          </div>
          <div className="text-right">
            <p className="max-w-xs leading-relaxed text-zinc-500 print:text-zinc-600">
              * Precios sujetos a cambio sin previo aviso.
              <br />* Tiempo de entrega sujeto a disponibilidad.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-800 flex justify-between items-center text-zinc-600 print:border-zinc-200">
          <div>Business Control System</div>
        </div>
      </div>
    </div>
  );
}
