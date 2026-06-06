import { findContactById, findContactsByEmail, updateContact } from "../../../repositories/contact.repository.js";
import { hashPassword, comparePassword } from "../../../utils/password.js";
import { signToken, verifyToken } from "../../../utils/jwt.js";
import { sendEmail } from "../../../utils/email.js";
import { logger } from "../../../utils/logger.js";

/**
 * Change password while authenticated.
 * Requires current password + new password.
 */
export async function changePortalPasswordAction({ contactId, currentPassword, newPassword }) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const contact = await findContactById(contactId);
  if (!contact || !contact.has_portal_access) {
    throw new Error("Contacto no encontrado o sin acceso al portal.");
  }

  const isValid = await comparePassword(currentPassword, contact.portal_password_hash);
  if (!isValid) {
    throw new Error("La contraseña actual es incorrecta.");
  }

  const hash = await hashPassword(newPassword);
  await updateContact(contactId, { portal_password_hash: hash });

  return true;
}

/**
 * Request a password reset email.
 * Generates a short-lived JWT and sends it via email.
 */
export async function requestPortalPasswordResetAction({ email }) {
  const contacts = await findContactsByEmail(email);

  // Always return true to avoid email enumeration
  if (!contacts.length) return true;

  const contact = contacts[0];
  
  // Create a short-lived reset token (15 minutes)
  const resetToken = signToken({
    contactId: contact.id,
    purpose: "portal_password_reset",
  });

  const portalUrl = "http://localhost:5173/portal/reset-password";
  const resetUrl = `${portalUrl}?token=${resetToken}`;

  const subject = "Restablecer contraseña — Business Control";
  const text = `Hola ${contact.full_name},\n\nRecibimos una solicitud para restablecer tu contraseña del portal de Business Control.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n${resetUrl}\n\nEste enlace expira en 15 minutos.\n\nSi no solicitaste esto, ignora este correo.\n\nSaludos,\nEl equipo de Business Control`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #4f46e5;">Restablecer contraseña</h2>
       <p>Hola <strong>${contact.full_name}</strong>,</p>
       <p>Recibimos una solicitud para restablecer tu contraseña del portal de <strong>Business Control</strong>.</p>
       <p style="margin: 24px 0;">
         <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #235b42; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Restablecer contraseña</a>
       </p>
       <p style="font-size: 12px; color: #888;">O copia este enlace en tu navegador:<br/><a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a></p>
       <p style="font-size: 12px; color: #888;">Este enlace expira en 15 minutos.</p>
       <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
       <p style="font-size: 12px; color: #888;">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
    </div>
  `;

  void sendEmail(contact.email, subject, text, html).catch((error) => {
    logger.error("Error enviando correo de reset de contraseña:", error);
  });

  return true;
}

/**
 * Reset password using a token from email.
 */
export async function resetPortalPasswordAction({ token, newPassword }) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new Error("El enlace ha expirado o es inválido. Solicita uno nuevo.");
  }

  if (payload.purpose !== "portal_password_reset") {
    throw new Error("Token inválido.");
  }

  const contact = await findContactById(payload.contactId);
  if (!contact || !contact.has_portal_access) {
    throw new Error("Contacto no encontrado o sin acceso al portal.");
  }

  const hash = await hashPassword(newPassword);
  await updateContact(contact.id, { portal_password_hash: hash });

  return true;
}
