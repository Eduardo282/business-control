import { listClients } from "../../../repositories/client.repository.js";

export async function listClientsAction({ limit, offset } = {}) {
  return listClients({ limit, offset });
}
