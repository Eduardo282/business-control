/**
 * QuotePdfGenerator — Responsabilidad Única: renderizar HTML a PDF usando Puppeteer.
 * No sabe nada de base de datos, plantillas HTML ni correos.
 */
import puppeteer from "puppeteer";

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      })
      .then((browser) => {
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }

  return browserPromise;
}

export async function warmQuotePdfBrowser() {
  await getBrowser();
}

export async function closeQuotePdfBrowser() {
  const activeBrowserPromise = browserPromise;
  browserPromise = null;
  if (!activeBrowserPromise) return;

  const browser = await activeBrowserPromise.catch(() => null);
  if (browser?.isConnected()) {
    await browser.close();
  }
}

/**
 * Convierte una cadena HTML en un buffer PDF usando Puppeteer.
 * Soporta Paged Media CSS completo: @page rules, page-break-inside, y
 * headers/footers repetidos con numeración dinámica "Página X de Y".
 *
 * @param {string} htmlContent — HTML completo para renderizar
 * @param {object} [options] — Opciones de PDF
 * @param {string} [options.format] — Formato de página (default: 'A4')
 * @param {boolean} [options.printBackground] — Imprimir fondos (default: true)
 * @param {string} [options.folio] — Folio de la cotización para el header
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
export async function renderHtmlToPdf(htmlContent, options = {}) {
  const {
    format = "A4",
    printBackground = true,
    folio = "",
  } = options;

  const headerTemplate = `
    <div style="width: 100%; font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #94a3b8; padding: 8px 40px 0 40px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 700; color: #0f172a;">Business Control</span>
      <span>${folio ? `Cotización ${folio}` : "Cotización"}</span>
    </div>
  `;

  const footerTemplate = `
    <div style="width: 100%; font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #94a3b8; padding: 0 40px 8px 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0;">
      <span>Generado por Business Control</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>
  `;

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format,
      printBackground,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: "106px",
        bottom: "80px",
        left: "0",
        right: "0",
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    if (page) await page.close();
  }
}

/**
 * Decodifica un PDF en base64 a un Buffer binario.
 * @param {string} pdfBase64 — Cadena base64 del PDF
 * @returns {Buffer} Buffer del PDF
 * @throws {Error} Si el base64 es inválido o el resultado está vacío
 */
export function decodePdfBase64(pdfBase64) {
  const normalized = String(pdfBase64)
    .trim()
    .replace(/^data:application\/pdf;base64,/i, "");

  let buffer;
  try {
    buffer = Buffer.from(normalized, "base64");
  } catch {
    throw new Error("El PDF adjunto no tiene un formato base64 válido.");
  }

  if (!buffer?.length) {
    throw new Error("El PDF adjunto está vacío.");
  }

  return buffer;
}
