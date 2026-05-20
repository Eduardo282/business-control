/**
 * EmailValidator — Responsabilidad Única: validar la entregabilidad de un correo electrónico.
 * Encapsula la lógica de ZeroBounce u otros proveedores.
 * No sabe nada de cotizaciones, PDFs ni SMTP.
 */
import { verifyEmailWithZeroBounce } from "../utils/zerobounce.js";

/**
 * Valida si un correo electrónico es entregable.
 * @param {string} email — Dirección de correo a validar
 * @returns {Promise<{ valid: boolean, reason: string }>}
 */
export async function validateEmailDeliverability(email) {
  const validation = await verifyEmailWithZeroBounce(email);

  if (validation.status === "invalid" || validation.status === "do_not_mail") {
    return {
      valid: false,
      reason: `ZeroBounce bloqueó envío (status: ${validation.status})`,
    };
  }

  return { valid: true, reason: "OK" };
}
