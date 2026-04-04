import { axiosClient } from "./axiosClient";

const graphQlBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";
const restBaseUrl = graphQlBaseUrl.replace(/\/graphql\/?$/i, "");

function restUrl(path) {
  return `${restBaseUrl}${path}`;
}

export async function createContactApi(input) {
  const query = `
    mutation CreateContact($input: CreateContactInput!) {
      createContact(input: $input) {
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
  `;
  const { data } = await axiosClient.post("", { query, variables: { input } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.createContact;
}

export async function updateContactApi(id, input) {
  const query = `
    mutation UpdateContact($id: ID!, $input: UpdateContactInput!) {
      updateContact(id: $id, input: $input) {
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
  `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { id, input },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.updateContact;
}

export async function deleteContactApi(id) {
  const query = `
    mutation DeleteContact($id: ID!) {
      deleteContact(id: $id)
    }
  `;
  const { data } = await axiosClient.post("", { query, variables: { id } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.deleteContact;
}

export async function listContactProductsApi(contactId) {
  const query = `
      query ListContactProducts($contactId: ID!) {
        contact(id: $contactId) {
            id
            active_services {
                id
                license_key
                start_date
                expiration_date
                status
                product {
                    id
                    name
                }
            }
        }
      }
    `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { contactId },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.contact ? data.data.contact.active_services : [];
}

export async function listContactsByClientApi(client_id) {
  const query = `
    query ListContactsByClient($client_id: ID!) {
      contactsByClient(client_id: $client_id) {
        id
        full_name
        email
      }
    }
  `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { client_id },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.contactsByClient || [];
}

export async function createContactProductApi(input) {
  const query = `
      mutation CreateContactProduct($input: CreateContactProductInput!) {
        createContactProduct(input: $input) {
          id
          license_key
          start_date
          expiration_date
          status
        }
      }
    `;
  const { data } = await axiosClient.post("", { query, variables: { input } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.createContactProduct;
}

export async function deleteContactProductApi(id) {
  const query = `
      mutation DeleteContactProduct($id: ID!) {
        deleteContactProduct(id: $id)
      }
    `;
  const { data } = await axiosClient.post("", { query, variables: { id } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.deleteContactProduct;
}

export async function bulkCreateContactsApi(inputs) {
  const query = `
    mutation BulkCreateContacts($inputs: [CreateContactInput!]!) {
      bulkCreateContacts(inputs: $inputs) {
        id
        client_id
        full_name
        email
        phone
        position_title
      }
    }
  `;
  const { data } = await axiosClient.post("", { query, variables: { inputs } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.bulkCreateContacts;
}

export async function listContactsDynamicByClientApi(clientId) {
  const { data } = await axiosClient.get(
    restUrl(`/api/contacts/client/${clientId}/dynamic`),
  );
  return data;
}

export async function updateContactDynamicApi(id, input) {
  const { data } = await axiosClient.put(
    restUrl(`/api/contacts/${id}/dynamic`),
    input,
  );
  return data;
}

export async function importContactsFromDriveApi({ fileUrl, clientId }) {
  try {
    const { data } = await axiosClient.post(
      restUrl("/api/contacts/import-drive"),
      {
        fileUrl,
        clientId,
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
