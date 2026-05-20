import { softDeleteContact } from "../../../repositories/contact.repository.js";

export async function deleteContactAction(id) {
  return softDeleteContact(id);
}
