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

  // Try each matching contact (handles duplicate emails)
  let matchedContact = null;
  for (const contact of rows) {
    if (!contact.portal_password_hash) continue;
    const isValid = await comparePassword(password, contact.portal_password_hash);
    if (isValid) {
      matchedContact = contact;
      break;
    }
  }

  if (!matchedContact) {
    throw new Error("Credenciales inválidas.");
  }

  const token = signToken({
    contactId: matchedContact.id,
    clientId: matchedContact.client_id,
    role: "CONTACT_PORTAL",
  });

  return {
    token,
    contact: {
      ...matchedContact,
      has_portal_access: !!matchedContact.has_portal_access,
    },
  };
}
