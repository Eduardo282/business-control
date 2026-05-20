/**
 * sendQuoteEmail.action.js — ORQUESTADOR
 *
 * Responsabilidad Única: coordinar el flujo de envío de cotización por correo.
 * Delega cada paso a un servicio especializado con responsabilidad única:
 *
 *   1. quoteRepository       → Consulta BD y ensambla la cotización completa
 *   2. quotePdfGenerator     → Decodifica base64 o renderiza HTML → PDF con Puppeteer
 *   3. quotePdfTemplate      → Construye el HTML del PDF y el HTML del email
 *   4. emailValidator        → Valida la entregabilidad del correo (ZeroBounce)
 *   5. quoteEmailSender      → Envía el correo SMTP con el PDF adjunto
 */
import { fetchFullQuote } from "../../../services/quoteRepository.service.js";
import { decodePdfBase64, renderHtmlToPdf } from "../../../services/quotePdfGenerator.service.js";
import { buildQuotePdfHtml, buildQuoteEmailHtml } from "../../../services/quotePdfTemplate.service.js";
import { validateEmailDeliverability } from "../../../services/emailValidator.service.js";
import { sendQuoteEmailMessage } from "../../../services/quoteEmailSender.service.js";
import { logger } from "../../../utils/logger.js";

export const sendQuoteEmailAction = async ({
  quote_id,
  contact_email,
  message,
  pdf_base64,
}) => {
  // 1. Repositorio: obtener la cotización completa de la BD
  const quote = await fetchFullQuote(quote_id);

  // 2. Generador PDF: decodificar el PDF adjunto del frontend (si existe)
  let providedPdfBuffer = null;
  if (pdf_base64) {
    providedPdfBuffer = decodePdfBase64(pdf_base64);
  }

  // 3. Lanzar el proceso pesado en segundo plano (no bloquea al frontend)
  (async () => {
    try {
      // a) Validador de correo
      const { valid, reason } = await validateEmailDeliverability(contact_email);
      if (!valid) {
        logger.warn(`[Segundo Plano] Envío bloqueado a ${contact_email}: ${reason}`);
        return;
      }

      // b) Generador PDF: usar el adjunto del frontend o renderizar desde plantilla
      let pdfBuffer = providedPdfBuffer;
      if (!pdfBuffer) {
        const pdfHtml = buildQuotePdfHtml(quote);
        pdfBuffer = await renderHtmlToPdf(pdfHtml);
      }

      // c) Plantilla email: construir el HTML del cuerpo del correo
      const emailHtml = buildQuoteEmailHtml(quote, message);
      const subject = `Cotización ${quote.folio || "#" + quote.id} - ${quote.client.business_name}`;
      const pdfFilename = `Cotizacion_${String(quote.folio || quote.id).replace(/[^a-zA-Z0-9-_]+/g, "_")}.pdf`;

      // d) Servicio de envío: despachar el correo con el PDF
      await sendQuoteEmailMessage({
        to: contact_email,
        subject,
        textMessage: message,
        htmlBody: emailHtml,
        pdfBuffer,
        pdfFilename,
      });

      logger.info(`[Segundo Plano] Correo enviado exitosamente a ${contact_email} para cotización ${quote_id}`);
    } catch (err) {
      logger.error(`[Segundo Plano] Error al procesar y enviar el correo de cotización ${quote_id}:`, err);
    }
  })();

  // Retornar éxito inmediato al cliente sin hacerle esperar
  return { success: true, message: "El proceso de envío de correo se ha iniciado." };
};
