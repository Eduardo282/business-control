import { updateContact, findContactById } from "../../../repositories/contact.repository.js";
import { hashPassword } from "../../../utils/password.js";
import { sendEmail } from "../../../utils/email.js";
import { logger } from "../../../utils/logger.js";

export async function updateContactAction(
  id,
  {
    full_name,
    email,
    phone,
    position_title,
    has_portal_access,
    portal_password,
  },
) {
  const data = {};

  if (full_name !== undefined) data.full_name = full_name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (position_title !== undefined) data.position_title = position_title;
  if (has_portal_access !== undefined) {
    data.has_portal_access = has_portal_access ? 1 : 0;
  }

  if (portal_password && has_portal_access !== false) {
    const hash = await hashPassword(portal_password);
    data.portal_password_hash = hash;
  }

  if (Object.keys(data).length > 0) {
    await updateContact(id, data);
  }

  const contact = await findContactById(id);

  // Enviar correo si se proporcionó una contraseña (nuevo acceso o reset)
  if (portal_password && contact?.email) {
    const subject = "¡Bienvenido a Business Control! - Tu Acceso al Portal";
    const portalUrl = "http://localhost:5173/portal/login";
    const text = `Hola ${contact.full_name},\n\nTe damos la bienvenida al portal de clientes de Business Control.\n\nTus credenciales de acceso:\n- Correo: ${contact.email}\n- Contraseña provisional: ${portal_password}\n\nIngresa al portal aquí: ${portalUrl}\n\nPuedes cambiar tu contraseña al ingresar.\n\nSaludos,\nEl equipo de Business Control`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
         <h2 style="color: #4f46e5;">¡Bienvenido, ${contact.full_name}!</h2>
         <p>Acabas de unirte al portal de clientes de <strong>Business Control</strong>, en donde disfrutarás de tus cotizaciones y podrás tener mejor comunicación con nosotros.</p>
         <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <p style="margin: 0; font-weight: bold;">Tus credenciales de acceso:</p>
           <table style="margin: 10px 0; border-collapse: collapse;">
             <tr>
               <td style="padding: 4px 12px 4px 0; font-weight: bold; color: #555;">Correo:</td>
               <td style="padding: 4px 0; font-family: monospace; color: #4f46e5;">${contact.email}</td>
             </tr>
             <tr>
               <td style="padding: 4px 12px 4px 0; font-weight: bold; color: #555;">Contraseña:</td>
               <td style="padding: 4px 0; font-size: 20px; font-family: monospace; color: #4f46e5;">${portal_password}</td>
             </tr>
           </table>
         </div>
         <p>Ingresa al portal haciendo clic en el siguiente enlace:</p>
         <p style="margin: 16px 0;"><a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Ir al Portal</a></p>
         <p style="font-size: 12px; color: #888;">O copia este enlace en tu navegador: <a href="${portalUrl}" style="color: #4f46e5;">${portalUrl}</a></p>
         <p>Puedes cambiar tu contraseña en tu portal al ingresar.</p>
         <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
         <p style="font-size: 12px; color: #888;">Si no solicitaste este acceso, por favor ignora este correo.</p>
      </div>
    `;

    // No bloquea la respuesta de la mutación: el correo se envía en segundo plano.
    void sendEmail(contact.email, subject, text, html).catch((error) => {
      logger.error("Error enviando correo de bienvenida:", error);
    });
  }

  return {
    ...contact,
    has_portal_access: Boolean(contact?.has_portal_access),
  };
}
