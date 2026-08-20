import { pool } from "../../config/db.js";
import {
  bulkCreateClients,
  createClient,
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
export async function searchClientsAction(params) {
  const q = typeof params === "string" ? params : params?.q;
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
 * Deletes a client record by ID (physical deletion).
 * Snapshots business_name and contact names on quotes and sales before deleting.
 * Contacts cascade-delete, quotes and sales set client_id to NULL.
 * @param {object|string|number} idOrObj
 * @returns {Promise<boolean>}
 */
export async function deleteClientAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  if (!id) return false;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE quotes q
       JOIN clients c ON q.client_id = c.id
       SET q.client_name = COALESCE(q.client_name, c.business_name)
       WHERE q.client_id = ?`,
      [id],
    );
    await connection.query(
      `UPDATE quotes q
       JOIN client_contacts cc ON q.contact_id = cc.id
       SET q.contact_name = COALESCE(q.contact_name, cc.full_name)
       WHERE q.client_id = ?`,
      [id],
    );
    await connection.query(
      `UPDATE sales s
       JOIN clients c ON s.client_id = c.id
       SET s.client_name = COALESCE(s.client_name, c.business_name)
       WHERE s.client_id = ?`,
      [id],
    );
    await connection.query(
      `UPDATE sales s
       JOIN client_contacts cc ON s.contact_id = cc.id
       SET s.contact_name = COALESCE(s.contact_name, cc.full_name)
       WHERE s.client_id = ?`,
      [id],
    );

    const [result] = await connection.query("DELETE FROM clients WHERE id = ?", [id]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
