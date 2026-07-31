import { calculateQuotePricing } from "@shared/quotePricingRules.js";

export default function SalePreview({
  sale,
  saleFolio,
  saleDateLabel,
  innerRef,
}) {
  const saleItems = Array.isArray(sale.items) ? sale.items : [];
  const pricing = calculateQuotePricing({ items: saleItems });

  return (
    <div
      data-export-preview="sale"
      ref={innerRef}
      className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-dark-700 dark:bg-dark-900 dark:text-zinc-100 print:m-0 print:w-full print:shadow-none"
    >
      <div className="bg-gradient-to-r from-[#0f274d] via-[#154982] to-[#1d6fb3] px-8 py-3 text-xs font-semibold uppercase tracking-wide text-white md:px-12 print:bg-white print:text-zinc-900 print:border-b print:border-zinc-200" />

      <div className="border-b border-zinc-100 p-8 dark:border-dark-700 md:p-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              VENTA
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Documento comercial de venta.
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Business Control
            </div>
            <div className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Av. Vallarta #1234, Col. Americana
              <br />
              Guadalajara, Jalisco, CP 44100
              <br />
              ventas@businesscontrol.com
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Folio
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {saleFolio}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Fecha de venta
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {saleDateLabel}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cotización origen
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {sale.quote?.folio || `#${sale.quote?.id || "—"}`}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-100 bg-zinc-50/60 px-8 py-8 dark:border-dark-700 dark:bg-dark-800/40 md:px-12">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900 lg:col-span-2">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cliente asignado
            </h3>
            <div className="text-xl font-bold leading-tight text-zinc-900 dark:text-zinc-100">
              {sale.client?.business_name || "Cliente eliminado"}
            </div>
            <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
              <div>{sale.client?.address || "Domicilio no registrado"}</div>
              <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                RFC: {sale.client?.rfc || "XAXX010101000"}
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-dark-700">
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Contacto asignado
              </h4>
              {sale.contact ? (
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sale.contact.full_name}
                  </div>
                  <div>{sale.contact.position_title || "Sin puesto"}</div>
                  <div>{sale.contact.email || "Sin correo"}</div>
                  <div>{sale.contact.phone || "Sin teléfono"}</div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Sin contacto asignado
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Ejecutivo de ventas
            </h3>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {sale.user?.full_name || "Usuario eliminado"}
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {sale.user?.email || "Sin correo"}
            </div>

            <div className="mt-5 space-y-1 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-dark-700 dark:text-zinc-400">
              <div>Canal: Atención comercial directa</div>
              <div>Moneda: MXN</div>
              <div>Impuesto aplicado: IVA 16%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[260px] px-8 py-8 md:px-12">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              <th className="rounded-l-lg bg-zinc-900 px-6 py-3 text-white">
                Producto vendido
              </th>
              <th className="bg-zinc-900 px-4 py-3 text-center text-white">Cant</th>
              <th className="bg-zinc-900 px-4 py-3 text-right text-white">Precio</th>
              <th className="bg-zinc-900 px-4 py-3 text-right text-white">Desc.</th>
              <th className="rounded-r-lg bg-zinc-900 px-6 py-3 text-right text-white">
                Importe
              </th>
            </tr>
          </thead>
          <tbody>
            {saleItems.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const discount = Number(item.discount) || 0;
              const lineTotal = Number(item.total) || unitPrice * quantity;

              return (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white dark:bg-dark-900" : "bg-zinc-50/70 dark:bg-dark-800/70"}
                >
                  <td className="py-4 pl-6 pr-4 align-top">
                    <div className="text-base font-bold leading-tight text-zinc-800 dark:text-zinc-100">
                      {item.product?.name || "Producto eliminado"}
                    </div>
                    {item.product?.folio && (
                      <div className="mt-1 font-mono text-[11px] font-semibold text-[#2277B4] dark:text-blue-400">
                        {item.product.folio}
                      </div>
                    )}
                    <div className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {item.product?.description || item.product?.category}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-mono align-top text-zinc-600 dark:text-zinc-300">
                    {quantity}
                  </td>
                  <td className="px-4 py-4 text-right font-mono align-top text-zinc-600 dark:text-zinc-300">
                    ${unitPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-right font-mono align-top text-zinc-600 dark:text-zinc-300">
                    {discount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}%
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right font-mono font-bold align-top text-zinc-900 dark:text-zinc-100">
                    ${lineTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 px-8 pb-8 md:px-12 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-dark-700 dark:bg-dark-800/70">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Condiciones de venta
          </h4>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li>1. Esta venta se generó a partir de una cotización aceptada.</li>
            <li>2. Los productos listados corresponden únicamente a lo vendido en este documento.</li>
            <li>3. Precios en MXN con IVA incluido.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Resumen financiero
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                ${pricing.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
              <span>IVA</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                ${pricing.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold text-zinc-900 dark:border-dark-700 dark:text-zinc-100">
              <span>Total</span>
              <span className="font-mono">
                ${pricing.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
