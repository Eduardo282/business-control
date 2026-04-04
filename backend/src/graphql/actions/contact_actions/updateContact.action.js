import { pool } from "../../../config/db.js";
import { hashPassword } from "../../../utils/password.js";
import { sendEmail } from "../../../utils/email.js";

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
  const updates = [];
  const params = { id };

  if (full_name !== undefined) {
    updates.push("full_name = :full_name");
    params.full_name = full_name;
  }
  if (email !== undefined) {
    updates.push("email = :email");
    params.email = email;
  }
  if (phone !== undefined) {
    updates.push("phone = :phone");
    params.phone = phone;
  }
  if (position_title !== undefined) {
    updates.push("position_title = :position_title");
    params.position_title = position_title;
  }
  if (has_portal_access !== undefined) {
    updates.push("has_portal_access = :has_portal_access");
    params.has_portal_access = has_portal_access ? 1 : 0;
  }

  if (portal_password && has_portal_access !== false) {
    const hash = await hashPassword(portal_password);
    updates.push("portal_password_hash = :portal_password_hash");
    params.portal_password_hash = hash;
  }

  if (updates.length > 0) {
    await pool.query(
      `UPDATE client_contacts SET ${updates.join(
        ", ",
      )} WHERE id = :id AND is_active = 1`,
      params,
    );
  }

  const [rows] = await pool.query(
    "SELECT * FROM client_contacts WHERE id = :id",
    { id },
  );

  // Enviar correo si se proporcionó una contraseña (nuevo acceso o reset)
  if (portal_password && rows[0]?.email) {
    const contact = rows[0];
    const subject = "¡Bienvenido a Business Control! - Tu Acceso al Portal";
    const text = `Hola ${contact.full_name},\n\nTe damos la bienvenida al portal de clientes de Business Control.\n\nTu contraseña provisional es: ${portal_password}\n\nPuedes cambiar tu contraseña al ingresar.\n\nSaludos,\nEl equipo de Business Control`;

    // HTML bonito opcional
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">¡Bienvenido, ${contact.full_name}!</h2>
        <p>Acabas de unirte al portal de clientes de <strong>Business Control</strong>, en donde disfrutarás de tus cotizaciones y podrás tener mejor comunicación con nosotros.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Tu contraseña provisional es:</p>
          <p style="font-size: 24px; color: #4f46e5; font-family: monospace; margin: 10px 0;">${portal_password}</p>
        </div>
        <p>Puedes cambiar tu contraseña en tu portal al ingresar.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Si no solicitaste este acceso, por favor ignora este correo.</p>
      </div>
    `;

    try {
      await sendEmail(contact.email, subject, text, html);
    } catch (error) {
      console.error("Error enviando correo de bienvenida:", error);
    }
  }

  return {
    ...rows[0],
    has_portal_access: Boolean(rows[0].has_portal_access),
  };
}
