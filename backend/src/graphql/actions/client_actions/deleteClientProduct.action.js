import { deleteClientProduct } from "../../../repositories/client.repository.js";

export async function deleteClientProductAction(id) {
  await deleteClientProduct(id);
  return true;
}
