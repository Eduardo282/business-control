/**
 * QuotePdfTemplate — Responsabilidad Única: construir el HTML de la cotización para renderizado PDF.
 * No sabe nada de base de datos, correos ni Puppeteer.
 */
import { calculateQuotePricing } from "../../../shared/quotePricingRules.js";
import { escapeHtml } from "../utils/htmlEscape.js";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

/**
 * Genera la cadena HTML completa de una cotización lista para renderizar como PDF.
 * Diseñada con Paged Media CSS para soporte multi-página profesional:
 * - @page rules con márgenes para header/footer de Puppeteer
 * - page-break-inside: avoid en filas y bloques críticos
 * - Bloque de firmas acompañado de últimos items
 * - Fuentes universales (Helvetica, Arial) para máxima compatibilidad
 * - Diseño plano, alto contraste, sin transparencias
 *
 * @param {object} quote — Cotización completa (con .client, .user, .contact, .items)
 * @returns {string} HTML listo para Puppeteer
 */
export function buildQuotePdfHtml(quote) {
  const pricing = calculateQuotePricing({ items: quote.items });

  const itemsHtml = pricing.items
    .map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const baseUnitPrice = Number(item.base_unit_price) || 0;
      const discount = Number(item.discount) || 0;
      const discountedUnitPrice = Number(item.unit_price) || 0;
      const lineTotal = Number(item.total) || discountedUnitPrice * quantity;
      const productName = escapeHtml(item.product_name);
      const productDescription = escapeHtml(
        [
          item.product_folio ? `Folio: ${item.product_folio}` : "",
          item.product_desc || item.product_category || "",
        ]
          .filter(Boolean)
          .join(" | "),
      );
      const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";

      return `
    <tr class="item-row" style="background-color: ${rowBg};">
      <td style="padding: 14px 16px; vertical-align: top; border-bottom: 1px solid #e2e8f0;">
        <div style="font-weight: 700; color: #1e293b; font-size: 14px; line-height: 1.4;">${productName}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.5;">
          ${productDescription}
          ${
            item.product_users_count > 0
              ? `<span style="display: inline-block; margin-left: 6px; font-size: 10px; background-color: #f1f5f9; padding: 1px 5px; border-radius: 3px; color: #64748b; border: 1px solid #e2e8f0;">${item.product_users_count} Usuario(s)</span>`
              : ""
          }
        </div>
      </td>
      <td style="padding: 14px 12px; text-align: center; color: #475569; vertical-align: top; font-family: 'Courier New', monospace; border-bottom: 1px solid #e2e8f0;">${quantity}</td>
      <td style="padding: 14px 12px; text-align: right; color: #475569; vertical-align: top; font-family: 'Courier New', monospace; border-bottom: 1px solid #e2e8f0;">${currencyFormatter.format(baseUnitPrice)}</td>
      <td style="padding: 14px 12px; text-align: right; color: ${discount > 0 ? "#dc2626" : "#475569"}; vertical-align: top; font-family: 'Courier New', monospace; border-bottom: 1px solid #e2e8f0;">${discount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}%</td>
      <td style="padding: 14px 12px; text-align: right; color: #475569; vertical-align: top; font-family: 'Courier New', monospace; border-bottom: 1px solid #e2e8f0;">${currencyFormatter.format(discountedUnitPrice)}</td>
      <td style="padding: 14px 16px; text-align: right; font-weight: 700; color: #0f172a; vertical-align: top; font-family: 'Courier New', monospace; border-bottom: 1px solid #e2e8f0;">${currencyFormatter.format(lineTotal)}</td>
    </tr>`;
    })
    .join("");

  const grossSubtotal = pricing.grossSubtotal;
  const subtotal = pricing.subtotal;
  const totalDiscountAmount = pricing.totalDiscount;
  const iva = pricing.iva;
  const total = pricing.total;

  const safeFolio = escapeHtml(quote.folio || "#" + quote.id);
  const safeClientName = escapeHtml(quote.client?.business_name || "");
  const resolvedAddress = quote.client?.address || (
    [quote.client?.ciudad, quote.client?.codigo_postal].filter(Boolean).join(", ")
  );
  
  const safeClientAddress = escapeHtml(
    resolvedAddress || "Domicilio no registrado"
  );
  const safeClientRfc = escapeHtml(quote.client?.rfc || "XAXX010101000");
  const safeUserName = escapeHtml(quote.user?.full_name || "");
  const safeUserEmail = escapeHtml(quote.user?.email || "");
  const safeNotes = escapeHtml(quote.notes || "");

  const createdDate = quote.created_at
    ? new Date(quote.created_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const validityDate = quote.created_at
    ? new Date(
        new Date(quote.created_at).getTime() + 15 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "15 días naturales";

  const contactInfoHtml = quote.contact
    ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
         <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px;">Contacto</div>
         <div style="font-weight: 600; color: #0f172a; font-size: 14px;">${escapeHtml(quote.contact.full_name || "Sin nombre")}</div>
         <div style="font-size: 13px; color: #475569; margin-top: 2px;">${escapeHtml(quote.contact.position_title || "Sin puesto")}</div>
         <div style="font-size: 13px; color: #475569; margin-top: 2px;">${escapeHtml(quote.contact.email || "Sin correo")}</div>
         <div style="font-size: 13px; color: #475569; margin-top: 2px;">${escapeHtml(quote.contact.phone || "Sin teléfono")}</div>
       </div>`
    : `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">Sin contacto asignado</div>`;

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          /* ===== Paged Media Rules ===== */
          @page {
            size: A4;
            margin: 80pt 40pt 60pt 40pt;
          }
          @page :first {
            margin-top: 0;
          }

          /* ===== Base Reset ===== */
          * { box-sizing: border-box; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 0;
            margin: 0;
            color: #334155;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 14px;
            line-height: 1.5;
          }
          .container { max-width: 100%; margin: 0 auto; background: #fff; }

          /* ===== Header Section ===== */
          .header {
            display: flex;
            justify-content: space-between;
            gap: 32px;
            padding: 40px 40px 32px 40px;
            border-bottom: 3px solid #0f172a;
          }
          .title {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.025em;
            margin: 0;
          }
          .subtitle {
            margin-top: 4px;
            font-size: 13px;
            color: #64748b;
          }
          .company-name { font-size: 22px; font-weight: 800; color: #0f172a; }
          .company-details { font-size: 13px; color: #64748b; margin-top: 6px; line-height: 1.6; }

          /* ===== Metadata Cards ===== */
          .meta-grid {
            display: flex;
            gap: 12px;
            padding: 24px 40px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          .meta-card {
            flex: 1;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            border-radius: 8px;
            padding: 12px 16px;
          }
          .meta-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin: 0;
          }
          .meta-value {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin: 4px 0 0 0;
          }

          /* ===== Info Grid ===== */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            padding: 32px 40px;
          }
          .info-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            background: #ffffff;
          }
          .info-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-name { font-size: 17px; font-weight: 700; color: #0f172a; }
          .info-detail { font-size: 13px; color: #475569; margin-top: 4px; }
          .info-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #64748b; margin-top: 4px; }

          /* ===== Items Table ===== */
          .table-container { padding: 0 40px 24px 40px; }
          .table-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin: 24px 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          table thead { page-break-after: avoid; }
          th {
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: #ffffff;
            background-color: #0f172a;
          }
          th:first-child { border-radius: 6px 0 0 6px; padding-left: 16px; }
          th:last-child { border-radius: 0 6px 6px 0; padding-right: 16px; }
          th.center { text-align: center; }
          th.right { text-align: right; }

          /* ===== Page Break Rules ===== */
          .item-row {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }

          /* ===== Totals ===== */
          .totals {
            padding: 0 40px 24px 40px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .totals-box {
            width: 320px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            background: #f8fafc;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #64748b;
            margin-bottom: 6px;
          }
          .total-mono { font-family: 'Courier New', monospace; color: #0f172a; font-weight: 600; }
          .total-discount { font-family: 'Courier New', monospace; color: #dc2626; font-weight: 600; }
          .total-final {
            display: flex;
            justify-content: space-between;
            border-top: 2px solid #0f172a;
            padding-top: 10px;
            margin-top: 8px;
            align-items: flex-end;
          }
          .final-label { font-size: 16px; font-weight: 800; color: #0f172a; }
          .final-value { font-size: 18px; font-weight: 800; font-family: 'Courier New', monospace; color: #0f172a; }

          /* ===== Notes ===== */
          .notes {
            padding: 0 40px 24px 40px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .notes-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin-bottom: 8px;
          }
          .notes-content {
            background: #f8fafc;
            padding: 14px 16px;
            border-radius: 6px;
            font-size: 13px;
            color: #475569;
            font-style: italic;
            border: 1px solid #e2e8f0;
            line-height: 1.6;
          }

          /* ===== Conditions + Summary ===== */
          .conditions-summary {
            padding: 0 40px 24px 40px;
            display: flex;
            gap: 16px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .conditions-box {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
          }
          .conditions-box ul {
            margin: 8px 0 0 0;
            padding-left: 18px;
          }
          .conditions-box li {
            font-size: 12px;
            color: #475569;
            margin-bottom: 6px;
            line-height: 1.5;
          }

          /* ===== Signature Block — travels with last items ===== */
          .signature-block {
            padding: 24px 40px 16px 40px;
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-before: avoid;
            break-before: avoid;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          .signature-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signature-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin: 0 0 40px 0;
          }
          .signature-line {
            border-top: 1px dashed #94a3b8;
            padding-top: 8px;
            font-size: 13px;
            color: #64748b;
          }

          /* ===== Footer ===== */
          .footer {
            background-color: #0f172a;
            color: white;
            padding: 32px 40px;
            font-size: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .footer-content { display: flex; justify-content: space-between; gap: 16px; }
          .footer-title { font-weight: 700; text-transform: uppercase; color: #34d399; margin-bottom: 4px; font-size: 11px; letter-spacing: 0.05em; }
          .footer-text { color: #94a3b8; line-height: 1.6; }
          .footer-right { text-align: right; }
          .footer-bottom {
            border-top: 1px solid #1e293b;
            margin-top: 20px;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            color: #64748b;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- HEADER -->
          <div class="header">
            <div>
              <h1 class="title">COTIZACIÓN</h1>
              <div class="subtitle">Cotización comercial formal</div>
            </div>
            <div style="text-align: right;">
              <div class="company-name">Business Control</div>
              <div class="company-details">
                Av. Vallarta #1234, Col. Americana<br>
                Guadalajara, Jalisco, CP 44100<br>
                ventas@businesscontrol.com
              </div>
            </div>
          </div>

          <!-- METADATA CARDS -->
          <div class="meta-grid">
            <div class="meta-card">
              <p class="meta-label">Folio de Cotización</p>
              <p class="meta-value" style="font-family: 'Courier New', monospace;">${safeFolio}</p>
            </div>
            <div class="meta-card">
              <p class="meta-label">Fecha de Emisión</p>
              <p class="meta-value">${createdDate}</p>
            </div>
            <div class="meta-card">
              <p class="meta-label">Vigencia</p>
              <p class="meta-value">${validityDate}</p>
            </div>
          </div>

          <!-- CLIENT + SALES REP -->
          <div class="info-grid">
            <div class="info-box">
              <div class="info-title">Cliente</div>
              <div class="info-name">${safeClientName}</div>
              <div class="info-detail">${safeClientAddress}</div>
              <div class="info-mono">RFC: ${safeClientRfc}</div>
              ${contactInfoHtml}
            </div>
            <div class="info-box">
              <div class="info-title">Ejecutivo de Ventas</div>
              <div class="info-name">${safeUserName}</div>
              <div class="info-detail">${safeUserEmail}</div>
              <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
                  Canal: Atención comercial directa<br>
                  Moneda: MXN<br>
                  Impuesto: IVA 16%
                </div>
              </div>
            </div>
          </div>

          <!-- ITEMS TABLE -->
          <div class="table-container">
            <div class="table-title">Detalle de Productos</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%; padding-left: 16px;">Descripción / Producto</th>
                  <th class="center" style="width: 8%;">Cant</th>
                  <th class="right" style="width: 13%;">Precio Lista</th>
                  <th class="right" style="width: 10%;">Desc.</th>
                  <th class="right" style="width: 14%;">Precio Unit.</th>
                  <th class="right" style="width: 15%; padding-right: 16px;">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- TOTALS -->
          <div class="totals">
            <div class="totals-box">
              <div class="total-row"><span>Subtotal bruto</span> <span class="total-mono">${currencyFormatter.format(grossSubtotal)}</span></div>
              <div class="total-row"><span>Descuento</span> <span class="total-discount">-${currencyFormatter.format(totalDiscountAmount)}</span></div>
              <div class="total-row"><span>Subtotal neto</span> <span class="total-mono">${currencyFormatter.format(subtotal)}</span></div>
              <div class="total-row"><span>IVA (16%)</span> <span class="total-mono">${currencyFormatter.format(iva)}</span></div>
              <div class="total-final"><span class="final-label">Total</span> <span class="final-value">${currencyFormatter.format(total)}</span></div>
            </div>
          </div>

          ${
            quote.notes
              ? `<!-- NOTES -->
          <div class="notes">
            <div class="notes-title">Notas Adicionales</div>
            <div class="notes-content">${safeNotes}</div>
          </div>`
              : ""
          }

          <!-- CONDITIONS -->
          <div class="conditions-summary">
            <div class="conditions-box" style="flex: 1;">
              <div class="info-title" style="border-bottom: none; padding-bottom: 0;">Condiciones Comerciales</div>
              <ul>
                <li>Vigencia hasta el ${validityDate}.</li>
                <li>Los precios se expresan en MXN e incluyen descuentos aplicados por producto.</li>
                <li>El tiempo de entrega queda sujeto a disponibilidad y confirmación de inventario.</li>
                <li>Cualquier ajuste posterior deberá formalizarse mediante una actualización de cotización.</li>
              </ul>
            </div>
          </div>

          <!-- SIGNATURES — break-inside: avoid keeps this with preceding content -->
          <div class="signature-block">
            <div class="signature-grid">
              <div class="signature-card">
                <p class="signature-label">Aceptación del Cliente</p>
                <div class="signature-line">Nombre y firma</div>
              </div>
              <div class="signature-card">
                <p class="signature-label">Ejecutivo Responsable</p>
                <div class="signature-line">${safeUserName}</div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <div class="footer-content">
              <div>
                <div class="footer-title">Información de Pago</div>
                <div class="footer-text">
                  Banco: BBVA Bancomer<br>
                  Cuenta: 0123456789<br>
                  CLABE: 012000001234567890<br>
                  Beneficiario: Business Control S.A. de C.V.
                </div>
              </div>
              <div class="footer-right">
                <div class="footer-text">
                  * Precios sujetos a cambios.<br>
                  * Tiempo de entrega sujeto a disponibilidad.
                </div>
              </div>
            </div>
            <div class="footer-bottom">
              <div>Generado por Business Control</div>
              <div style="font-family: 'Courier New', monospace;">${createdDate}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Genera el HTML del cuerpo del correo electrónico de cotización.
 * Incluye resumen ejecutivo profesional:
 * - Saludo personalizado con nombre del contacto
 * - Monto total destacado
 * - Vigencia de la propuesta
 * - Puntos de valor principales
 * - CTA claro con siguiente paso
 *
 * @param {object} quote — Cotización completa
 * @param {string} message — Mensaje personalizado del vendedor
 * @param {object} [pricingData] — Datos de pricing pre-calculados (opcional)
 * @returns {string} HTML del email
 */
export function buildQuoteEmailHtml(quote, message, pricingData = null) {
  const htmlMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const folio = escapeHtml(quote.folio || "#" + quote.id);
  const contactName = escapeHtml(
    quote.contact?.full_name || "Estimado cliente",
  );
  const sellerName = escapeHtml(
    quote.user?.full_name || "Equipo de Ventas",
  );
  const sellerEmail = escapeHtml(quote.user?.email || "ventas@businesscontrol.com");

  // Calculate pricing if not provided
  const pricing = pricingData || calculateQuotePricing({ items: quote.items || [] });
  const totalFormatted = currencyFormatter.format(pricing.total);
  const itemCount = pricing.items?.length || 0;

  const validityDate = quote.created_at
    ? new Date(
        new Date(quote.created_at).getTime() + 15 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "15 días naturales";

  // Build top 3 items summary for value points
  const topItems = (pricing.items || []).slice(0, 3);
  const valuePointsHtml = topItems.length > 0
    ? topItems
        .map(
          (item) =>
            `<tr>
              <td style="padding: 6px 0; vertical-align: top; width: 20px; color: #34d399; font-size: 16px; font-weight: bold;">✓</td>
              <td style="padding: 6px 0; color: #334155; font-size: 14px;">${escapeHtml(item.product_name)} <span style="color: #94a3b8;">×${item.quantity || 1}</span></td>
            </tr>`,
        )
        .join("")
    : "";

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <!-- HEADER -->
      <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #34d399;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Business Control</h1>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Cotización Comercial</p>
      </div>

      <!-- BODY -->
      <div style="padding: 32px 28px;">
        <!-- Greeting -->
        <p style="color: #0f172a; font-size: 16px; margin: 0 0 20px 0; font-weight: 600;">
          Estimado/a ${contactName},
        </p>

        <!-- Executive Summary Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Cotización</p>
              <p style="margin: 4px 0 0; font-size: 16px; color: #0f172a; font-weight: 700; font-family: 'Courier New', monospace;">${folio}</p>
            </div>
          </div>

          <!-- Total Highlight -->
          <div style="background-color: #0f172a; border-radius: 8px; padding: 16px 20px; text-align: center; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total de la cotización</p>
            <p style="margin: 6px 0 0; font-size: 28px; color: #34d399; font-weight: 800; font-family: 'Courier New', monospace;">${totalFormatted}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">${itemCount} concepto${itemCount !== 1 ? "s" : ""} · IVA incluido</p>
          </div>

          <!-- Validity -->
          <div style="text-align: center; padding: 8px 0;">
            <p style="margin: 0; font-size: 13px; color: #475569;">
              <strong style="color: #0f172a;">Vigencia:</strong> válida hasta el ${validityDate}
            </p>
          </div>
        </div>

        ${
          valuePointsHtml
            ? `<!-- Value Points -->
        <div style="margin-bottom: 24px;">
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Incluye:</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${valuePointsHtml}
          </table>
          ${itemCount > 3 ? `<p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">y ${itemCount - 3} concepto${itemCount - 3 !== 1 ? "s" : ""} más — ver PDF adjunto para detalle completo.</p>` : ""}
        </div>`
            : ""
        }

        <!-- Custom Message -->
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.7;">
            ${htmlMessage}
          </p>
        </div>

        <!-- PDF Attachment Notice -->
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #065f46; font-size: 13px; margin: 0; line-height: 1.5;">
            <strong>📎<br> Se ha adjuntado la cotización formal detallada en formato PDF para su evaluación.
          </p>
        </div>

        <!-- CTA -->

        <!-- Seller Signature -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${sellerName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">${sellerEmail}</p>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">Business Control</p>
        </div>
      </div>

      <!-- EMAIL FOOTER -->
      <div style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #1e293b; font-weight: 700; margin: 0 0 4px 0; font-size: 13px;">Business Control S.A. de C.V.</p>
        <p style="color: #64748b; margin: 0 0 12px 0; font-size: 12px;">Av. Vallarta #1234, Col. Americana, Guadalajara, Jalisco, CP 44100</p>
        <p style="color: #94a3b8; margin: 0; font-size: 11px; line-height: 1.5; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          Este documento confidencial es de uso exclusivo para las personas a las que va dirigido.<br>
          Si usted recibió este correo por error, por favor elimínelo y comuníquelo al remitente.
        </p>
      </div>
    </div>
  `;
}
