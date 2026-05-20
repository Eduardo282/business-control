import { deleteContactProduct } from "../../../repositories/contact.repository.js";

export async function deleteContactProductAction(id) {
  await deleteContactProduct(id);
  return true;
}
