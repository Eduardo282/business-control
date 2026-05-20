import { createContact } from "../../../repositories/contact.repository.js";

export async function createContactAction({ client_id, full_name, email, phone, position_title }) {
  const insertId = await createContact({
    client_id,
    full_name,
    email,
    phone,
    position_title,
  });

  return {
    id: insertId,
    client_id,
    full_name,
    email: email || null,
    phone: phone || null,
    position_title: position_title || null,
  };
}
