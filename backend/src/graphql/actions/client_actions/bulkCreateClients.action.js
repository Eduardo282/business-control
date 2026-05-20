import { bulkCreateClients } from "../../../repositories/client.repository.js";

/**
 * Inserta múltiples clientes de forma eficiente.
 * @param {string} created_by_user_id
 * @param {Array<object>} clients - Array de objetos con los campos del cliente
 * @returns {Array<object>} clientes creados con su id
 */
export async function bulkCreateClientsAction(created_by_user_id, clients) {
  return bulkCreateClients(created_by_user_id, clients);
}
