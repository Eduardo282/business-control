import { calculateQuotePricing } from "@shared/quotePricingRules.js";
import { notificationService } from "../../../services/notificationService";
import { addPdfPageFooters } from "../../../utils/pdfTableExport";

export function getSaleFolio(sale) {
  const rawFolio = sale?.folio ? String(sale.folio).trim() : "";
  return rawFolio || `VTA-${String(sale?.id ?? "").padStart(6, "0")}`;
}

function getSaleFileToken(sale) {
  const raw = sale?.folio ? String(sale.folio).trim() : `VTA-${String(sale?.id ?? "sale").padStart(6, "0")}`;
  return raw.replace(/[^a-zA-Z0-9-_]+/g, "_");
}

/**
 * Genera y descarga un documento Word (.doc) que imita exactamente la interfaz visual del componente SalePreview.
 */
export function exportSaleWord(sale) {
  const saleFolio = getSaleFolio(sale);
  const fileToken = getSaleFileToken(sale);
  const saleItems = Array.isArray(sale?.items) ? sale.items : [];
  const pricing = calculateQuotePricing({ items: saleItems });

  const escapeHtml = (val) =>
    String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const money = (val) =>
    `$${Number(val || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const saleDateLabel = sale?.created_at
    ? new Date(sale.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  const quoteOriginLabel = sale?.quote?.folio || (sale?.quote?.id ? `#${sale.quote.id}` : "—");

  const itemsRowsHtml = pricing.items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const discount = Number(item.discount) || 0;
    const total = Number(item.total) || unitPrice * qty;
    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    const prodName = escapeHtml(item.product?.name || "Producto eliminado");
    const prodFolio = item.product?.folio ? escapeHtml(item.product.folio) : "";
    const prodDesc = escapeHtml(item.product?.description || item.product?.category || "");

    return `
      <tr style="background:${bg}; page-break-inside:avoid; mso-row-break-inside:avoid;">
        <td style="padding:16px 20px; border-bottom:1px solid #f1f5f9; vertical-align:top;">
          <div style="font-size:15px; font-weight:bold; color:#1e293b; line-height:1.2;">${prodName}</div>
          ${prodFolio ? `<div style="margin-top:4px; font-family:monospace; font-size:11px; font-weight:bold; color:#2277B4;">${prodFolio}</div>` : ""}
          ${prodDesc ? `<div style="margin-top:4px; color:#64748b; font-size:12px; line-height:1.4;">${prodDesc}</div>` : ""}
        </td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; text-align:center; font-family:monospace; color:#475569; vertical-align:top;">${qty}</td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-family:monospace; color:#475569; vertical-align:top;">${money(unitPrice)}</td>
        <td style="padding:16px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-family:monospace; color:#475569; vertical-align:top;">${discount}%</td>
        <td style="padding:16px 20px; border-bottom:1px solid #f1f5f9; text-align:right; font-family:monospace; font-weight:bold; color:#0f172a; vertical-align:top;">${money(total)}</td>
      </tr>
    `;
  }).join("");

  const wordHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page { size: A4; margin: 1.2cm; }
          body { font-family: Inter, 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #ffffff; }
          .top-bar { background: #0f274d; height: 12px; width: 100%; border-radius: 8px 8px 0 0; }
          .container { padding: 32px 40px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .title { font-size: 36px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
          .subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
          .company-name { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; text-align: right; }
          .company-address { font-size: 13px; color: #64748b; line-height: 1.5; text-align: right; margin-top: 4px; }
          
          .meta-grid { width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 24px; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; }
          .meta-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .meta-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px; }

          .section-grid { width: 100%; border-collapse: separate; border-spacing: 16px 0; margin-bottom: 32px; }
          .section-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; vertical-align: top; }
          .sec-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 12px; }
          .client-name { font-size: 20px; font-weight: bold; color: #0f172a; line-height: 1.2; }
          .client-text { font-size: 13px; color: #475569; margin-top: 6px; line-height: 1.4; }
          .divider { border-top: 1px solid #e2e8f0; margin: 16px 0; }

          .product-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          .product-table th { background: #18181b; color: #ffffff; padding: 12px 16px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .product-table th.left { text-align: left; }
          .product-table th.center { text-align: center; }
          .product-table th.right { text-align: right; }

          .bottom-grid { width: 100%; border-collapse: separate; border-spacing: 16px 0; }
          .cond-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; vertical-align: top; }
          .fin-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; vertical-align: top; }
          .fin-row { display: table; width: 100%; margin-bottom: 8px; font-size: 14px; color: #64748b; }
          .fin-val { text-align: right; font-family: monospace; color: #0f172a; }
          .fin-total { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; font-size: 18px; font-weight: bold; color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="top-bar"></div>
          
          <table class="header-table">
            <tr>
              <td style="vertical-align:top;">
                <h1 class="title">VENTA</h1>
                <div class="subtitle">Documento comercial de venta.</div>
              </td>
              <td style="vertical-align:top;">
                <div class="company-name">Business Control</div>
                <div class="company-address">
                  Av. Vallarta #1234, Col. Americana<br />
                  Guadalajara, Jalisco, CP 44100<br />
                  ventas@businesscontrol.com
                </div>
              </td>
            </tr>
          </table>

          <table class="meta-grid">
            <tr>
              <td style="width:33.33%;">
                <div class="meta-card">
                  <div class="meta-label">Folio</div>
                  <div class="meta-val" style="font-family:monospace;">${saleFolio}</div>
                </div>
              </td>
              <td style="width:33.33%;">
                <div class="meta-card">
                  <div class="meta-label">Fecha de Venta</div>
                  <div class="meta-val">${saleDateLabel}</div>
                </div>
              </td>
              <td style="width:33.33%;">
                <div class="meta-card">
                  <div class="meta-label">Cotización Origen</div>
                  <div class="meta-val" style="font-family:monospace;">${quoteOriginLabel}</div>
                </div>
              </td>
            </tr>
          </table>

          <table class="section-grid">
            <tr>
              <td style="width:65%;" class="section-card">
                <div class="sec-title">Cliente Asignado</div>
                <div class="client-name">${escapeHtml(sale.client?.business_name || "Cliente eliminado")}</div>
                <div class="client-text">
                  ${escapeHtml(sale.client?.address || "Domicilio no registrado")}<br />
                  <span style="font-family:monospace; font-size:12px; color:#64748b;">RFC: ${escapeHtml(sale.client?.rfc || "XAXX010101000")}</span>
                </div>

                <div class="divider"></div>

                <div class="sec-title">Contacto Asignado</div>
                ${sale.contact ? `
                  <div style="font-size:14px; font-weight:bold; color:#0f172a;">${escapeHtml(sale.contact.full_name)}</div>
                  <div class="client-text">
                    ${escapeHtml(sale.contact.position_title || "Sin puesto")}<br />
                    ${escapeHtml(sale.contact.email || "Sin correo")}<br />
                    ${escapeHtml(sale.contact.phone || "Sin teléfono")}
                  </div>
                ` : `
                  <div style="font-size:13px; color:#64748b;">Sin contacto asignado</div>
                `}
              </td>

              <td style="width:35%;" class="section-card">
                <div class="sec-title">Ejecutivo de Ventas</div>
                <div style="font-size:16px; font-weight:bold; color:#0f172a;">${escapeHtml(sale.user?.full_name || "Usuario eliminado")}</div>
                <div style="font-size:13px; color:#64748b; margin-top:2px;">${escapeHtml(sale.user?.email || "Sin correo")}</div>

                <div class="divider"></div>

                <div style="font-size:12px; color:#64748b; line-height:1.6;">
                  Canal: Atención comercial directa<br />
                  Moneda: MXN<br />
                  Impuesto aplicado: IVA 16%
                </div>
              </td>
            </tr>
          </table>

          <table class="product-table">
            <thead>
              <tr>
                <th class="left" style="border-radius: 8px 0 0 8px;">Producto Vendido</th>
                <th class="center">Cant</th>
                <th class="right">Precio</th>
                <th class="right">Desc.</th>
                <th class="right" style="border-radius: 0 8px 8px 0;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <table class="bottom-grid">
            <tr>
              <td style="width:60%;" class="cond-card">
                <div class="sec-title">Condiciones de Venta</div>
                <div style="font-size:13px; color:#475569; line-height:1.6;">
                  1. Esta venta se generó a partir de una cotización aceptada.<br />
                  2. Los productos listados corresponden únicamente a lo vendido en este documento.<br />
                  3. Precios en MXN con IVA incluido.
                </div>
              </td>

              <td style="width:40%;" class="fin-card">
                <div class="sec-title">Resumen Financiero</div>
                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="font-size:14px; color:#64748b; padding-bottom:6px;">Subtotal</td>
                    <td style="font-size:14px; color:#0f172a; font-family:monospace; text-align:right; padding-bottom:6px;">${money(pricing.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px; color:#64748b; padding-bottom:6px;">IVA</td>
                    <td style="font-size:14px; color:#0f172a; font-family:monospace; text-align:right; padding-bottom:6px;">${money(pricing.iva)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:16px; font-weight:bold; color:#0f172a; border-top:1px solid #e2e8f0; padding-top:10px;">Total</td>
                    <td style="font-size:18px; font-weight:bold; color:#0f172a; font-family:monospace; text-align:right; border-top:1px solid #e2e8f0; padding-top:10px;">${money(pricing.total)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Venta_${fileToken}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  notificationService.toast({ title: "Word exportado correctamente.", icon: "success" });
}

/**
 * Genera y descarga un PDF idéntico a la vista previa de la interfaz utilizando html2canvas + jsPDF.
 */
export async function exportSalePdf(sale, element) {
  const fileToken = getSaleFileToken(sale);
  try {
    const targetElement = element || document.querySelector('[data-export-preview="sale"]');
    if (!targetElement) {
      notificationService.error("Error", "No se encontró la vista previa de la venta para exportar.");
      return;
    }

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    // Capturar exactamente el componente visual SalePreview
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const horizontalMargin = 10;
    const topMargin = 10;
    const bottomMargin = 17;
    const imgWidth = pageWidth - horizontalMargin * 2;
    const printableHeight = pageHeight - topMargin - bottomMargin;
    const pixelsPerMillimeter = canvas.width / imgWidth;
    const sourcePageHeight = Math.max(
      1,
      Math.floor(printableHeight * pixelsPerMillimeter),
    );
    const pageCount = Math.max(
      1,
      Math.ceil(canvas.height / sourcePageHeight),
    );

    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) pdf.addPage();

      const sourceY = page * sourcePageHeight;
      const sliceHeight = Math.min(
        sourcePageHeight,
        canvas.height - sourceY,
      );
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const pageContext = pageCanvas.getContext("2d");

      if (!pageContext) {
        throw new Error("No se pudo preparar una página del PDF.");
      }

      pageContext.fillStyle = "#ffffff";
      pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      pdf.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        horizontalMargin,
        topMargin,
        imgWidth,
        sliceHeight / pixelsPerMillimeter,
      );
    }

    addPdfPageFooters(pdf, { margin: horizontalMargin });
    pdf.save(`Venta_${fileToken}.pdf`);
    notificationService.toast({ title: "PDF exportado correctamente.", icon: "success" });
  } catch (e) {
    notificationService.error("Error", e?.message || "No se pudo generar el PDF de la venta.");
  }
}
