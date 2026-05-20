/**
 * QuotePdfGenerator — Responsabilidad Única: renderizar HTML a PDF usando Puppeteer.
 * No sabe nada de base de datos, plantillas HTML ni correos.
 */
import puppeteer from "puppeteer";

/**
 * Convierte una cadena HTML en un buffer PDF usando Puppeteer.
 * @param {string} htmlContent — HTML completo para renderizar
 * @param {object} [options] — Opciones de PDF (formato, fondo, etc.)
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
export async function renderHtmlToPdf(htmlContent, options = {}) {
  const {
    format = "A4",
    printBackground = true,
  } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    return await page.pdf({ format, printBackground });
  } finally {
    if (browser) await browser.close();
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
