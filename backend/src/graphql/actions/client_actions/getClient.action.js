import { findClientById } from "../../../repositories/client.repository.js";

export async function getClientAction(id) {
  return findClientById(id);
}
