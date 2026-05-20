import { bulkCreateContacts } from "../../../repositories/contact.repository.js";

/**
 * Inserta múltiples contactos de forma eficiente.
 * @param {Array<object>} contacts - Array con { client_id, full_name, email, phone, position_title }
 * @returns {Array<object>} contactos creados con su id
 */
export async function bulkCreateContactsAction(contacts) {
  return bulkCreateContacts(contacts);
}
