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
                 id
                 folio
                 name
                 category
                 product_type
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
        is_registered
        is_sent_to_client_portal
        notes
        items {
          id
          product {
            id
            folio
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

export async function listPortalSalesApi() {
  const query = `
    query {
      sales {
        id
        folio
        created_at
        total
        status
        portal_sent_at
        quote {
          id
          folio
        }
        items {
          id
          quantity
          total
          product {
            id
            folio
            name
          }
        }
      }
    }
  `;
  const data = await gql(query, {}, portalAxiosClient);
  return data.sales;
}

export async function getPortalSaleApi(id) {
  const query = `
    query GetPortalSale($id: ID!) {
      sale(id: $id) {
        id
        folio
        created_at
        total
        status
        portal_sent_at
        quote {
          id
          folio
        }
        client {
          business_name
          rfc
          address
        }
        contact {
          full_name
          email
          phone
          position_title
        }
        user {
          full_name
          email
        }
        items {
          id
          quantity
          base_unit_price
          unit_price
          discount
          total
          product {
            id
            folio
            name
            category
            description
            users_count
          }
        }
      }
    }
  `;
  const data = await gql(query, { id }, portalAxiosClient);
  return data.sale;
}

export async function deletePortalSaleApi(id) {
  const query = `
    mutation DeletePortalSale($id: ID!) {
      deletePortalSale(id: $id)
    }
  `;
  const data = await gql(query, { id }, portalAxiosClient);
  return data.deletePortalSale;
}

export async function listPortalProductsApi() {
  const query = `
    query {
      portalProducts {
        id
        folio
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
        folio
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

export async function acceptPortalQuoteApi(id) {
  const query = `
    mutation AcceptPortalQuote($id: ID!) {
      acceptPortalQuote(id: $id)
    }
  `;
  const data = await gql(query, { id }, portalAxiosClient);
  return data.acceptPortalQuote;
}

export async function rejectPortalQuoteApi(id) {
  const query = `
    mutation RejectPortalQuote($id: ID!) {
      rejectPortalQuote(id: $id)
    }
  `;
  const data = await gql(query, { id }, portalAxiosClient);
  return data.rejectPortalQuote;
}

export async function deletePortalContactProductApi(id) {
  const query = `
    mutation DeletePortalContactProduct($id: ID!) {
      deletePortalContactProduct(id: $id)
    }
  `;
  const data = await gql(query, { id }, portalAxiosClient);
  return data.deletePortalContactProduct;
}

export async function updatePortalQuoteRequestApi(id, items) {
  const query = `
    mutation UpdatePortalQuoteRequest($id: ID!, $input: RequestQuoteInput!) {
      updatePortalQuoteRequest(id: $id, input: $input) {
        id
        folio
        status
        total
      }
    }
  `;
  const data = await gql(query, { id, input: { items } }, portalAxiosClient);
  return data.updatePortalQuoteRequest;
}

export async function changePortalPasswordApi(contactId, currentPassword, newPassword) {
  const query = `
    mutation ChangePortalPassword($contactId: ID!, $currentPassword: String!, $newPassword: String!) {
      changePortalPassword(contactId: $contactId, currentPassword: $currentPassword, newPassword: $newPassword)
    }
  `;
  const data = await gql(query, { contactId, currentPassword, newPassword }, portalAxiosClient);
  return data.changePortalPassword;
}

export async function requestPortalPasswordResetApi(email) {
  const query = `
    mutation RequestPortalPasswordReset($email: String!) {
      requestPortalPasswordReset(email: $email)
    }
  `;
  const data = await gql(query, { email }, portalAxiosClient);
  return data.requestPortalPasswordReset;
}

export async function resetPortalPasswordApi(token, newPassword) {
  const query = `
    mutation ResetPortalPassword($token: String!, $newPassword: String!) {
      resetPortalPassword(token: $token, newPassword: $newPassword)
    }
  `;
  const data = await gql(query, { token, newPassword }, portalAxiosClient);
  return data.resetPortalPassword;
}
