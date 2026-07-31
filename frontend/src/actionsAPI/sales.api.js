import { gql } from "../utils/graphqlClient";

const SALE_FIELDS = `
  id
  folio
  created_at
  total
  status
  email_sent_at
  is_sent_to_client_portal
  portal_sent_at
  notes
  quote {
    id
    folio
  }
  client {
    id
    business_name
    rfc
    address
    contacts {
      id
      full_name
      email
      has_portal_access
    }
  }
  contact {
    id
    full_name
    email
    phone
    position_title
    has_portal_access
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
`;

export async function listSalesApi() {
  const query = `
    query ListSales {
      sales {
        ${SALE_FIELDS}
      }
    }
  `;
  const data = await gql(query);
  return data.sales;
}

export async function getSaleApi(id) {
  const query = `
    query GetSale($id: ID!) {
      sale(id: $id) {
        ${SALE_FIELDS}
      }
    }
  `;
  const data = await gql(query, { id });
  return data.sale;
}

export async function createSaleFromQuoteApi(input) {
  const query = `
    mutation CreateSaleFromQuote($input: CreateSaleFromQuoteInput!) {
      createSaleFromQuote(input: $input) {
        id
        folio
        total
        status
      }
    }
  `;
  const data = await gql(query, { input });
  return data.createSaleFromQuote;
}

export async function toggleSalePortalApi(id, access, contact_id) {
  const query = `
    mutation ToggleSalePortal($id: ID!, $access: Boolean!, $contact_id: ID) {
      toggleSalePortal(id: $id, access: $access, contact_id: $contact_id)
    }
  `;
  const data = await gql(query, { id, access, contact_id });
  return data.toggleSalePortal;
}

export async function sendSaleEmailApi({ sale_id, contact_email, message }) {
  const query = `
    mutation SendSaleEmail($sale_id: ID!, $contact_email: String!, $message: String!) {
      sendSaleEmail(sale_id: $sale_id, contact_email: $contact_email, message: $message) {
        success
        message
        email_sent_at
      }
    }
  `;
  const data = await gql(query, { sale_id, contact_email, message });
  return data.sendSaleEmail;
}

export async function deleteSaleApi(id) {
  const query = `
    mutation DeleteSale($id: ID!) {
      deleteSale(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.deleteSale;
}
