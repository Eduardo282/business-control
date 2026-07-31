import { axiosClient } from "./axiosClient";
import { gql } from "../utils/graphqlClient";

const graphQlBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";
const restBaseUrl = graphQlBaseUrl.replace(/\/graphql\/?$/i, "");

function restUrl(path) {
  return `${restBaseUrl}${path}`;
}

/**
 * Fetches the full list of backoffice clients.
 * @returns {Promise<Array<object>>} List of client records.
 */
export async function listClientsApi() {
  const query = `
    query {
      clients {
        id
        business_name
        rfc
        email1
        email2
        celular
        telefono
        codigo_postal
        ciudad
      }
    }
  `;
  const data = await gql(query);
  return data.clients;
}

/**
 * Fetches a single client detail record along with associated contacts.
 * @param {string|number} id - Client ID.
 * @returns {Promise<object>} Client detail record.
 */
export async function getClientApi(id) {
  const query = `
    query Client($id: ID!) {
      client(id: $id) {
        id
        business_name
        rfc
        email1
        email2
        celular
        telefono
        codigo_postal
        ciudad
        contacts { 
          id 
          client_id 
          full_name 
          email 
          phone 
          position_title 
          has_portal_access
          is_active
        }
      }
    }
  `;
  const data = await gql(query, { id });
  return data.client;
}

/**
 * Fetches active services associated with a client's contacts.
 * @param {string|number} client_id - Target Client ID.
 * @returns {Promise<Array<object>>} Flattened list of active service licenses.
 */
export async function listClientActiveServicesApi(client_id) {
  const query = `
    query($client_id: ID!) {
      contactsByClient(client_id: $client_id) {
        id
        full_name
        active_services {
          id
          license_key
          start_date
          expiration_date
          status
          product {
            folio
            name
            category
          }
        }
      }
    }
  `;
  const data = await gql(query, { client_id });

  const allServices = [];
  data.contactsByClient.forEach((contact) => {
    contact.active_services.forEach((service) => {
      allServices.push({ ...service, contact_name: contact.full_name });
    });
  });
  return allServices;
}

/**
 * Searches clients by name or RFC string.
 * @param {string} q - Search query term.
 * @returns {Promise<Array<object>>} Matching client records.
 */
export async function searchClientsApi(q) {
  const query = `
    query Search($q: String!) {
      searchClients(q: $q) {
        id
        business_name
        rfc
        email1
        email2
        celular
        telefono
        codigo_postal
        ciudad
      }
    }
  `;
  const data = await gql(query, { q });
  return data.searchClients;
}

/**
 * Creates a new client record.
 * @param {object} input - Client creation payload.
 * @returns {Promise<object>} Created client record.
 */
export async function createClientApi(input) {
  const query = `
    mutation CreateClient($input: CreateClientInput!) {
      createClient(input: $input) {
        id
        business_name
        rfc
        email1
        email2
        celular
        telefono
        codigo_postal
        ciudad
      }
    }
  `;
  const data = await gql(query, { input });
  return data.createClient;
}

/**
 * Updates an existing client record.
 * @param {string|number} id - Target Client ID.
 * @param {object} input - Update fields payload.
 * @returns {Promise<object>} Updated client record.
 */
export async function updateClientApi(id, input) {
  const query = `
    mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
      updateClient(id: $id, input: $input) {
        id
        business_name
        rfc
        email1
        email2
        celular
        telefono
        codigo_postal
        ciudad
        contacts { 
            id 
            client_id 
            full_name 
            email 
            phone 
            position_title
            has_portal_access 
        }
      }
    }
  `;
  const data = await gql(query, { id, input });
  return data.updateClient;
}

/**
 * Deletes a client record.
 * @param {string|number} id - Client ID to delete.
 * @returns {Promise<boolean>} Deletion success state.
 */
export async function deleteClientApi(id) {
  const query = `
    mutation DeleteClient($id: ID!) {
      deleteClient(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.deleteClient;
}

/**
 * Creates multiple client records in bulk.
 * @param {Array<object>} inputs - List of client creation inputs.
 * @returns {Promise<Array<object>>} Created client records.
 */
export async function bulkCreateClientsApi(inputs) {
  const query = `
    mutation BulkCreateClients($inputs: [CreateClientInput!]!) {
      bulkCreateClients(inputs: $inputs) {
        id
        business_name
        rfc
        email1
        email2
        celular
        telefono
        codigo_postal
        ciudad
      }
    }
  `;
  const data = await gql(query, { inputs });
  return data.bulkCreateClients;
}

/**
 * Fetches dynamic client custom attributes schema via REST endpoint.
 * @returns {Promise<object>} Dynamic schema configuration.
 */
export async function listClientsDynamicApi() {
  const { data } = await axiosClient.get(restUrl("/api/clients/dynamic"));
  return data;
}

/**
 * Updates dynamic client custom attributes via REST endpoint.
 * @param {string|number} id - Client ID.
 * @param {object} input - Custom fields payload.
 * @returns {Promise<object>} Response payload.
 */
export async function updateClientDynamicApi(id, input) {
  const { data } = await axiosClient.put(
    restUrl(`/api/clients/${id}/dynamic`),
    input,
  );
  return data;
}

/**
 * Imports client records from Google Drive spreadsheet URL.
 * @param {string} fileUrl - Google Drive URL string.
 * @returns {Promise<object>} Import result summary.
 */
export async function importClientsFromDriveApi(fileUrl) {
  try {
    const { data } = await axiosClient.post(
      restUrl("/api/clients/import-drive"),
      { fileUrl },
    );
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "No se pudo importar el archivo desde Drive.";
    throw new Error(message);
  }
}

/**
 * Imports client records from local base64 file data.
 * @param {string} fileBase64 - Base64 encoded file string.
 * @returns {Promise<object>} Import result summary.
 */
export async function importClientsFromLocalApi(fileBase64) {
  try {
    const { data } = await axiosClient.post(
      restUrl("/api/clients/import-local-base64"),
      { fileBase64 },
    );
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "No se pudo importar el archivo local.";
    throw new Error(message);
  }
}
