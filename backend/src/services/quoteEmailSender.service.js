/**
 * QuoteEmailSender — Responsabilidad Única: enviar el correo electrónico con el PDF adjunto.
 * Recibe datos ya procesados; no sabe nada de BD, HTML ni validación.
 */
import { sendEmail } from "../utils/email.js";

/**
 * Envía un correo electrónico de cotización con PDF adjunto.
 * @param {object} params
 * @param {string} params.to — Dirección del destinatario
 * @param {string} params.subject — Asunto del correo
 * @param {string} params.textMessage — Mensaje en texto plano
 * @param {string} params.htmlBody — HTML del cuerpo del correo
 * @param {Buffer} params.pdfBuffer — Buffer binario del PDF
 * @param {string} params.pdfFilename — Nombre del archivo adjunto
 * @returns {Promise<object>} Resultado del envío SMTP
 */
export async function sendQuoteEmailMessage({
  to,
  subject,
  textMessage,
  htmlBody,
  pdfBuffer,
  pdfFilename,
}) {
  return sendEmail(to, subject, textMessage, htmlBody, [
    {
      filename: pdfFilename,
      content: pdfBuffer,
    },
  ]);
}
