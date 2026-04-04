import { pool } from "../../../config/db.js";
import { comparePassword } from "../../../utils/password.js";
import { signToken } from "../../../utils/jwt.js";

export async function loginContactAction({ email, password }) {
  const [rows] = await pool.query(
    "SELECT * FROM client_contacts WHERE email = :email AND has_portal_access = 1",
    { email }
  );

  if (rows.length === 0) {
    throw new Error("Credenciales inválidas o acceso al portal no habilitado.");
  }

  const contact = rows[0];

  if (!contact.portal_password_hash) {
    throw new Error(
      "El contacto no tiene contraseña configurada para el portal."
    );
  }

  const isValid = await comparePassword(password, contact.portal_password_hash);
  if (!isValid) {
    throw new Error("Credenciales inválidas.");
  }

  const token = signToken({
    contactId: contact.id,
    clientId: contact.client_id, // Mantener el contexto del negocio
    role: "CONTACT_PORTAL",
  });

  return {
    token,
    contact: {
      ...contact,
      has_portal_access: !!contact.has_portal_access,
    },
  };
}
