import { axiosClient } from "./axiosClient";
import { gql } from "../utils/graphqlClient";

const graphQlBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";
const restBaseUrl = graphQlBaseUrl.replace(/\/graphql\/?$/i, "");

function restUrl(path) {
  return `${restBaseUrl}${path}`; // Construye la URL completa para las rutas REST eliminando "/graphql" si es necesario //api/clients/dynamic -> http://localhost:4000/api/clients/dynamic
}

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

export async function deleteClientApi(id) {
  const query = `
    mutation DeleteClient($id: ID!) {
      deleteClient(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.deleteClient;
}

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

export async function listClientsDynamicApi() {
  const { data } = await axiosClient.get(restUrl("/api/clients/dynamic"));
  return data;
}

export async function updateClientDynamicApi(id, input) {
  const { data } = await axiosClient.put(
    restUrl(`/api/clients/${id}/dynamic`),
    input,
  );
  return data;
}

export async function importClientsFromDriveApi(fileUrl) {
  try {
    const { data } = await axiosClient.post(
      restUrl("/api/clients/import-drive"),
      {
        fileUrl,
      },
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
