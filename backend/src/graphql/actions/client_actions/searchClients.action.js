import { searchClients } from "../../../repositories/client.repository.js";

export async function searchClientsAction(q) {
  return searchClients(q);
}
