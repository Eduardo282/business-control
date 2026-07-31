import {
  bulkCreateClients,
  createClient,
  deleteClient,
  findClientById,
  listClients,
  searchClients,
  updateClient,
} from "../../repositories/client.repository.js";

/**
 * Lists all backoffice clients.
 * @returns {Promise<Array<object>>}
 */
export async function listClientsAction() {
  return listClients();
}

/**
 * Fetches a single client by ID.
 * @param {object} params
 * @param {string|number} params.id
 * @returns {Promise<object|null>}
 */
export async function getClientAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  return findClientById(id);
}

/**
 * Searches clients by name or RFC text.
 * @param {object} params
 * @param {string} params.q
 * @returns {Promise<Array<object>>}
 */
export async function searchClientsAction({ q }) {
  return searchClients(q);
}

/**
 * Creates a new client.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createClientAction({
  created_by_user_id,
  business_name,
  rfc,
  email1,
  email2,
  celular,
  telefono,
  codigo_postal,
  ciudad,
}) {
  const data = {
    created_by_user_id,
    business_name,
    rfc: rfc || null,
    email1: email1 || null,
    email2: email2 || null,
    celular: celular || null,
    telefono: telefono || null,
    codigo_postal: codigo_postal || null,
    ciudad: ciudad || null,
  };

  const insertId = await createClient(data);

  return {
    id: insertId,
    business_name,
    rfc: rfc || null,
    email1: email1 || null,
    email2: email2 || null,
    celular: celular || null,
    telefono: telefono || null,
    codigo_postal: codigo_postal || null,
    ciudad: ciudad || null,
  };
}

/**
 * Updates an existing client record.
 * @param {object|string|number} idOrObj
 * @param {object} [inputObj]
 * @returns {Promise<object>}
 */
export async function updateClientAction(idOrObj, inputObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null && !inputObj ? idOrObj.id : idOrObj;
  const input = typeof idOrObj === "object" && idOrObj !== null && !inputObj ? idOrObj.input : inputObj;

  const payload = {
    business_name: input.business_name,
    rfc: input.rfc ?? null,
    email1: input.email1 ?? null,
    email2: input.email2 ?? null,
    celular: input.celular ?? null,
    telefono: input.telefono ?? null,
    codigo_postal: input.codigo_postal ?? null,
    ciudad: input.ciudad ?? null,
  };

  await updateClient(id, payload);
  return findClientById(id);
}

/**
 * Deletes a client record by ID.
 * @param {object|string|number} idOrObj
 * @returns {Promise<boolean>}
 */
export async function deleteClientAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  if (!id) return false;
  const rowsAffected = await deleteClient(id);
  return rowsAffected > 0;
}

/**
 * Bulk creates multiple clients.
 * @param {object} payload
 * @param {Array<object>} payload.inputs
 * @param {string|number} [payload.created_by_user_id]
 * @returns {Promise<Array<object>>}
 */
export async function bulkCreateClientsAction({ inputs, created_by_user_id }) {
  return bulkCreateClients(inputs, created_by_user_id);
}
