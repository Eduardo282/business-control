import { calculateQuotePricing } from "@shared/quotePricingRules.js";
import { notificationService } from "../../../../services/notificationService";

let html2pdfLoaderPromise = null;

async function loadHtml2Pdf() {
  if (!html2pdfLoaderPromise) {
    html2pdfLoaderPromise = (async () => {
      try {
        const module = await import("html2pdf.js");
        return module.default || module;
      } catch {
        const fallbackModule = await import(
          /* @vite-ignore */ "/node_modules/html2pdf.js/dist/html2pdf.bundle.min.js"
        );
        return fallbackModule.default || fallbackModule;
      }
    })().catch((error) => {
      html2pdfLoaderPromise = null;
      throw error;
    });
  }
  return html2pdfLoaderPromise;
}

function waitForStablePaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

export function getQuoteFolio(sourceQuote) {
  const rawFolio = sourceQuote?.folio ? String(sourceQuote.folio).trim() : "";
  return rawFolio || `#${sourceQuote?.id ?? ""}`;
}

export function getQuoteFileToken(sourceQuote) {
  const raw =
    sourceQuote?.folio ?
      String(sourceQuote.folio).trim()
    : String(sourceQuote?.id ?? "quote");
  const cleaned = raw.replace(/[^a-zA-Z0-9-_]+/g, "_");
  return cleaned || "quote";
}

export function useQuotePdf(quote, quotePreviewRef) {
  const buildPdfFromSnapshot = async () => {
    const node = quotePreviewRef.current;
    if (!node) throw new Error("No se pudo obtener la vista de la cotización.");

    await waitForStablePaint();
    const html2pdf = await loadHtml2Pdf();

    const opt = {
      margin:       [30, 0, 30, 0], // Top, left, bottom, right margins in pt
      filename:     'Cotizacion.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 1.5, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (clonedDocument) => {
          const clonedRoot = clonedDocument.querySelector(
            '[data-export-preview="quote"]'
          );
          if (clonedRoot) {
            clonedRoot.style.cssText += "opacity:1;filter:none;transform:none;animation:none;border-radius:0;margin:0;width:100%;max-width:none;border:none;";
          }
          clonedDocument.documentElement.classList.remove("dark");
          clonedDocument.body.classList.remove("dark");
          const animatedElements = clonedDocument.querySelectorAll(
            ".animate-fade-in, .animate-slide-up, .animate-scale-in"
          );
          animatedElements.forEach((element) => {
            element.style.cssText += "opacity:1;filter:none;transform:none;animation:none;transition:none;";
          });
        }
      },
      jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const worker = html2pdf().set(opt).from(node);
    
    const pdfBase64DataUri = await worker.outputPdf('datauristring');
    const pdfBase64 = pdfBase64DataUri.split(",")[1] || "";
    
    const pdfBlob = await html2pdf().set(opt).from(node).outputPdf('blob');

    const doc = {
      output: (type) => {
        if (type === 'blob') return pdfBlob;
        if (type === 'datauristring') return pdfBase64DataUri;
        return pdfBlob;
      },
      save: (filename) => {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    };

    return { doc, pdfBase64 };
  };

  const handlePrint = async () => {
    const quoteFileToken = getQuoteFileToken(quote);
    try {
      const { doc } = await buildPdfFromSnapshot();
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const previewWindow = window.open(blobUrl, "_blank", "noopener");
      if (!previewWindow) {
        doc.save(`Cotizacion_${quoteFileToken}.pdf`);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      notificationService.toast({ title: "PDF exportado con la vista actual.", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e?.message || "No se pudo exportar el PDF.");
    }
  };

  const handleExportWord = async () => {
    const quoteFileToken = getQuoteFileToken(quote);
    try {
      const escapeHtml = (value) =>
        String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const money = (value) =>
        `$${Number(value || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      const percent = (value) =>
        `${Number(value || 0).toLocaleString("es-MX", {
          maximumFractionDigits: 2,
        })}%`;

      const localItems = Array.isArray(quote?.items) ? quote.items : [];
      const localPricing = calculateQuotePricing({ items: localItems });
      const localGrossSubtotal = localPricing.grossSubtotal;
      const localNetSubtotal = localPricing.subtotal;
      const localTotalDiscount = localPricing.totalDiscount;
      const localIva = localPricing.iva;
      const localTotal = localPricing.total;

      const wordFolio = getQuoteFolio(quote);
      const wordDateLabel =
        quote?.created_at ?
          new Date(quote.created_at).toLocaleDateString("es-MX")
        : "";
      const wordValidityLabel = "15 dias naturales";

      const rowsHtml =
        localPricing.items.length > 0 ?
          localPricing.items
            .map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const baseUnitPrice = Number(item.base_unit_price) || 0;
              const discount = Number(item.discount) || 0;
              const discountedUnitPrice = Number(item.unit_price) || 0;
              const lineTotal = Number(item.total) || 0;
              const lineBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
              const usersCount = Number(item.product?.users_count) || 0;
              const productMeta = [
                item.product?.folio ? `Folio: ${item.product.folio}` : "",
                item.product?.description || item.product?.category || "",
                usersCount > 0 ? `${usersCount} Usuario(s)` : "",
              ]
                .filter(Boolean)
                .join(" | ");

              return `
                <tr style="background:${lineBg}; page-break-inside: avoid;">
                  <td style="padding:12px 12px; border-bottom:1px solid #e2e8f0; vertical-align:top;">
                    <div style="font-weight:700; color:#1e293b; font-size:14px;">${escapeHtml(item.product?.name || "Producto eliminado")}</div>
                    <div style="margin-top:4px; color:#64748b; font-size:11px; line-height:1.4;">${escapeHtml(productMeta)}</div>
                  </td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:center; vertical-align:top; color:#475569;">${escapeHtml(String(quantity))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#475569;">${escapeHtml(money(baseUnitPrice))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:${discount > 0 ? "#be123c" : "#475569"};">${escapeHtml(percent(discount))}</td>
                  <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#475569;">${escapeHtml(money(discountedUnitPrice))}</td>
                  <td style="padding:12px 12px; border-bottom:1px solid #e2e8f0; text-align:right; vertical-align:top; color:#0f172a; font-weight:700;">${escapeHtml(money(lineTotal))}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="6" style="padding:14px; text-align:center; color:#64748b; border-bottom:1px solid #e2e8f0;">Sin partidas en la cotizacion</td></tr>`;

      const notesBlock =
        quote?.notes ?
          `<div class="notes-wrap">
             <div class="section-title">Notas Adicionales</div>
             <div class="notes-card">${escapeHtml(quote.notes).replace(/\n/g, "<br />")}</div>
           </div>`
        : "";

      const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="UTF-8" />
            <meta name="ProgId" content="Word.Document" />
            <style>
              @page {
                size: A4;
                margin: 1.2cm;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #0f172a;
              }
              .page {
                width: 100%;
                max-width: 980px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .card, .conditions, .finance, .sign-card, .metric-card, .notes-card {
                page-break-inside: avoid;
              }
              .top-strip {
                background: #1d4f88;
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 9px 22px;
              }
              .top-strip table {
                width: 100%;
                border-collapse: collapse;
              }
              .top-strip td:last-child {
                text-align: right;
              }
              .main-block {
                padding: 28px 26px;
                border-bottom: 1px solid #e2e8f0;
              }
              .main-grid {
                width: 100%;
                border-collapse: collapse;
              }
              .main-grid td {
                vertical-align: top;
              }
              .title {
                font-size: 54px;
                line-height: 1;
                font-weight: 800;
                margin: 0;
                color: #0f172a;
                letter-spacing: -0.8px;
              }
              .subtitle {
                margin-top: 8px;
                color: #64748b;
                font-size: 20px;
                line-height: 1.35;
              }
              .brand {
                text-align: right;
              }
              .brand-name {
                font-size: 32px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
                line-height: 1.15;
              }
              .brand-meta {
                margin-top: 8px;
                color: #64748b;
                font-size: 13px;
                line-height: 1.5;
              }
              .metric-table {
                margin-top: 18px;
                width: 100%;
                border-collapse: separate;
                border-spacing: 8px 0;
                margin-left: -8px;
                margin-right: -8px;
              }
              .metric-card {
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 12px;
                padding: 10px 14px;
              }
              .metric-label {
                margin: 0;
                font-size: 10px;
                color: #64748b;
                font-weight: 700;
              }
              .metric-val {
                margin: 4px 0 0 0;
                font-size: 16px;
                font-weight: 800;
                color: #0f172a;
              }
              .info-grid {
                width: 100%;
                border-collapse: collapse;
                margin-top: 24px;
              }
              .info-grid td {
                width: 50%;
                padding: 0;
                vertical-align: top;
              }
              .card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                background: #ffffff;
              }
              .card-title {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin: 0 0 12px 0;
              }
              .card-name {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 8px 0;
              }
              .card-meta {
                font-size: 13px;
                color: #475569;
                line-height: 1.6;
              }
              .items-title {
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                margin: 32px 0 16px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #e2e8f0;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
              }
              .items-table th {
                background: #f1f5f9;
                color: #475569;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 10px 12px;
                border-bottom: 2px solid #cbd5e1;
              }
              .summary-wrap {
                margin-top: 32px;
                page-break-inside: avoid;
              }
              .summary-grid {
                width: 100%;
                border-collapse: collapse;
              }
              .conditions {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin-right: 16px;
              }
              .conditions ul {
                margin: 12px 0 0 0;
                padding-left: 20px;
              }
              .conditions li {
                font-size: 12px;
                color: #475569;
                margin-bottom: 8px;
                line-height: 1.5;
              }
              .finance {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
              }
              .section-title {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin: 0 0 16px 0;
              }
              .totals-table {
                width: 100%;
                border-collapse: collapse;
              }
              .totals-table td {
                padding: 6px 0;
                font-size: 14px;
                color: #475569;
              }
              .totals-table td:last-child {
                text-align: right;
                font-weight: 700;
                color: #0f172a;
              }
              .totals-final td {
                padding-top: 12px;
                border-top: 2px solid #cbd5e1;
                font-size: 18px;
                font-weight: 800 !important;
                color: #1d4f88 !important;
              }
              .notes-wrap {
                margin-top: 28px;
                page-break-inside: avoid;
              }
              .notes-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                background: #ffffff;
                font-size: 13px;
                color: #334155;
                line-height: 1.6;
              }
              .sign-wrap {
                margin-top: 40px;
                page-break-inside: avoid;
              }
              .sign-grid {
                width: 100%;
                border-collapse: separate;
                border-spacing: 24px 0;
                margin-left: -24px;
                margin-right: -24px;
              }
              .sign-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 24px;
                background: #ffffff;
                text-align: center;
              }
              .line-space {
                margin-top: 48px;
                border-top: 1px dashed #94a3b8;
                padding-top: 12px;
                font-size: 13px;
                color: #64748b;
              }
              .footer {
                margin-top: 48px;
                padding: 28px;
                border-radius: 12px;
                font-size: 11px;
                line-height: 1.6;
              }
              .footer-title {
                font-size: 12px;
                font-weight: 700;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .footer-copy {
                font-size: 11px;
              }
              .footer-note {
                text-align: right;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="top-strip">
                <table>
                  <tr>
                    <td>Propuesta Comercial Privada</td>
                    <td>Vence: ${escapeHtml(wordValidityLabel)}</td>
                  </tr>
                </table>
              </div>

              <div class="main-block">
                <table class="main-grid">
                  <tr>
                    <td>
                      <h1 class="title">COTIZACIÓN</h1>
                      <div class="subtitle">Propuesta de Servicios y Licenciamiento</div>
                    </td>
                    <td class="brand">
                      <div class="brand-name">Business Control</div>
                      <div class="brand-meta">
                        business-control.mx<br />
                        contacto@business-control.mx
                      </div>
                    </td>
                  </tr>
                </table>

                <table class="metric-table">
                  <tr>
                    <td style="width:33%;">
                      <div class="metric-card">
                        <p class="metric-label">FOLIO DE COTIZACIÓN</p>
                        <p class="metric-val">${escapeHtml(wordFolio)}</p>
                      </div>
                    </td>
                    <td style="width:33%;">
                      <div class="metric-card">
                        <p class="metric-label">FECHA DE EMISIÓN</p>
                        <p class="metric-val">${escapeHtml(wordDateLabel)}</p>
                      </div>
                    </td>
                    <td style="width:33%;">
                      <div class="metric-card">
                        <p class="metric-label">VALIDEZ PROPUESTA</p>
                        <p class="metric-val">${escapeHtml(wordValidityLabel)}</p>
                      </div>
                    </td>
                  </tr>
                </table>

                <table class="info-grid">
                  <tr>
                    <td style="padding-right:12px;">
                      <div class="card" style="height: 180px;">
                        <p class="card-title">Cliente Receptor</p>
                        <p class="card-name">${escapeHtml(quote.client?.business_name || "Cliente General")}</p>
                        <div class="card-meta">
                          RFC: ${escapeHtml(quote.client?.tax_id || "XAXX010101000")}<br />
                          Direccion: ${escapeHtml(quote.client?.address || "Direccion no registrada")}
                        </div>
                      </div>
                    </td>
                    <td style="padding-left:12px;">
                      <div class="card" style="height: 180px;">
                        <p class="card-title">Contacto Autorizado</p>
                        <p class="card-name">${escapeHtml(quote.contact?.full_name || "Atencion Directa")}</p>
                        <div class="card-meta">
                          Email: ${escapeHtml(quote.contact?.email || "Sin correo de contacto")}<br />
                          Telefono: ${escapeHtml(quote.contact?.phone || "Sin telefono registrado")}
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>

                <div class="items-title">Detalle de Partidas</div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width:45%; text-align:left; padding-left:12px;">Concepto / Descripcion</th>
                      <th style="width:8%; text-align:center;">Cant.</th>
                      <th style="width:12%; text-align:right;">Precio U.</th>
                      <th style="width:10%; text-align:right;">Desc.</th>
                      <th style="width:12%; text-align:right;">Neto U.</th>
                      <th style="width:13%; text-align:right; padding-right:12px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>

              <div class="summary-wrap">
                <table class="summary-grid">
                  <tr>
                    <td style="width:64%; vertical-align:top;">
                      <div class="conditions">
                        <p class="section-title">Condiciones Comerciales</p>
                        <ul>
                          <li>Esta propuesta tiene una vigencia de ${escapeHtml(wordValidityLabel)}.</li>
                          <li>Los precios se expresan en MXN e incluyen descuentos aplicados por partida.</li>
                          <li>El tiempo de entrega queda sujeto a disponibilidad y confirmacion de inventario.</li>
                          <li>Cualquier ajuste posterior debera formalizarse mediante actualizacion de cotizacion.</li>
                        </ul>
                      </div>
                    </td>
                    <td style="width:36%; vertical-align:top;">
                      <div class="finance">
                        <p class="section-title">Resumen Financiero</p>
                        <table class="totals-table">
                          <tr><td>Subtotal bruto</td><td>${escapeHtml(money(localGrossSubtotal))}</td></tr>
                          <tr><td>Descuento</td><td>-${escapeHtml(money(localTotalDiscount))}</td></tr>
                          <tr><td>Subtotal neto</td><td>${escapeHtml(money(localNetSubtotal))}</td></tr>
                          <tr><td>IVA (16%)</td><td>${escapeHtml(money(localIva))}</td></tr>
                          <tr class="totals-final"><td>Total Neto</td><td>${escapeHtml(money(localTotal))}</td></tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              ${notesBlock}

              <div class="sign-wrap">
                <table class="sign-grid">
                  <tr>
                    <td style="width:50%; vertical-align:top;">
                      <div class="sign-card">
                        <p class="section-title">Aceptacion del Cliente</p>
                        <div class="line-space">Nombre y firma</div>
                      </div>
                    </td>
                    <td style="width:50%; vertical-align:top;">
                      <div class="sign-card">
                        <p class="section-title">Ejecutivo Responsable</p>
                        <div class="line-space">${escapeHtml(quote.user?.full_name || "Sin asignar")}</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="footer" style="background-color: #0f172a; background: #0f172a;">
                <table class="footer-grid" style="background-color: #0f172a; width: 100%;">
                  <tr>
                    <td style="width:60%; vertical-align:top; border: none; padding-right:10px; background-color: #0f172a;" bgcolor="#0f172a">
                      <p class="footer-title" style="color: #34d399;">Informacion de Pago</p>
                      <div class="footer-copy" style="color: #94a3b8;">
                        Banco: BBVA Bancomer<br />
                        Cuenta: 0123456789<br />
                        CLABE: 012000001234567890<br />
                        Beneficiario: Business Control S.A. de C.V.
                      </div>
                    </td>
                    <td style="width:40%; vertical-align:top; border: none; background-color: #0f172a;" bgcolor="#0f172a">
                      <div class="footer-note" style="color: #94a3b8;">
                        * Precios sujetos a cambio sin previo aviso.<br />
                        * Tiempo de entrega sujeto a disponibilidad.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob(["\ufeff", wordHtml], {
        type: "application/msword;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${quoteFileToken}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notificationService.toast({ title: "Word exportado correctamente.", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e?.message || "No se pudo exportar Word.");
    }
  };

  return {
    handlePrint,
    handleExportWord,
    buildPdfFromSnapshot,
  };
}
