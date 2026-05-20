import { listClients } from "../../../repositories/client.repository.js";

export async function listClientsAction() {
  return listClients();
}
