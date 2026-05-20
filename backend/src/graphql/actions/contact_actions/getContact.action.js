import { findContactById } from "../../../repositories/contact.repository.js";

export async function getContactAction(id) {
  return findContactById(id);
}
