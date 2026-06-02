import { portalAxiosClient } from "./portalAxiosClient";
import { gql } from "../utils/graphqlClient";

export async function loginContactApi(email, password) {
  const query = `
    mutation LoginContact($email: String!, $password: String!) {
      loginContact(email: $email, password: $password) {
        token
        contact {
          id
          full_name
          email
          position_title
        }
      }
    }
  `;

  const data = await gql(query, { email, password }, portalAxiosClient);
  return data.loginContact;
}

export async function getContactDataApi(contactId) {
  const query = `
      query GetContactData($id: ID!) {
        contact(id: $id) {
          id
          full_name
          email
          position_title
          client_id
          active_services {
             id
             license_key
             start_date
             expiration_date
             status
             product {
                 name
                 category
                 description
             }
          }
        }
      }
    `;

  const data = await gql(query, { id: contactId }, portalAxiosClient);
  return data.contact;
}

export async function listPortalQuotesApi() {
  const query = `
    query {
      quotes {
        id
        folio
        created_at
        total
        status
        notes
        items {
          id
          product {
            name
          }
          quantity
          total
        }
      }
    }
  `;
  const data = await gql(query, {}, portalAxiosClient);
  return data.quotes;
}

export async function listPortalProductsApi() {
  const query = `
    query {
      portalProducts {
        id
        name
        category
        product_type
        description
      }
    }
  `;
  const data = await gql(query, {}, portalAxiosClient);
  return data.portalProducts;
}

export async function requestQuoteApi(items) {
  // items: [{ product_id, quantity }]
  const query = `
    mutation RequestQuote($input: RequestQuoteInput!) {
      requestQuote(input: $input) {
        id
        status
      }
    }
  `;
  const data = await gql(query, { input: { items } }, portalAxiosClient);
  return data.requestQuote;
}

export async function deletePortalQuoteApi(id) {
  const query = `
    mutation DeletePortalQuote($id: ID!) {
      deletePortalQuote(id: $id)
    }
  `;
  const data = await gql(query, { id }, portalAxiosClient);
  return data.deletePortalQuote;
}

export async function updatePortalQuoteRequestApi(id, items) {
  const query = `
    mutation UpdatePortalQuoteRequest($id: ID!, $input: RequestQuoteInput!) {
      updatePortalQuoteRequest(id: $id, input: $input) {
        id
        status
        total
      }
    }
  `;
  const data = await gql(query, { id, input: { items } }, portalAxiosClient);
  return data.updatePortalQuoteRequest;
}
