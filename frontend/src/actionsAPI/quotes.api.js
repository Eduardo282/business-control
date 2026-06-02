import { gql } from "../utils/graphqlClient";

export const listQuotesApi = async () => {
  const query = `
    query {
      quotes {
        id
        folio
        created_at
        total
        status
        client {
          business_name
        }
        user {
          full_name
        }
        contact {
          full_name
        }
      }
    }
  `;
  const data = await gql(query);
  return data.quotes;
};
export const listQuotesByClientApi = async (client_id) => {
  const query = `
    query($client_id: ID!) {
      quotesByClient(client_id: $client_id) {
        id
        created_at
        total
        status
        user {
          full_name
        }
        contact {
          full_name
        }
      }
    }
  `;
  const data = await gql(query, { client_id });
  return data.quotesByClient;
};
export const getQuoteApi = async (id) => {
  const query = `
    query GetQuote($id: ID!) {
      quote(id: $id) {
        id
        folio
        created_at
        total
        status
        notes
        is_sent_to_client_portal
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
            name
            description
            users_count
          }
        }
      }
    }
  `;
  const data = await gql(query, { id });
  return data.quote;
};

export const createQuoteApi = async (input) => {
  const query = `
    mutation CreateQuote($input: CreateQuoteInput!) {
      createQuote(input: $input) {
        id
        folio
        total
        status
      }
    }
  `;
  const data = await gql(query, { input });
  return data.createQuote;
};
export const resolveQuoteRequestApi = async (requestId, input) => {
  const query = `
    mutation ResolveQuoterequest($requestId: ID!, $input: CreateQuoteInput!) {
      resolveQuoteRequest(requestId: $requestId, input: $input) {
        id
        folio
        total
        status
      }
    }
  `;
  const data = await gql(query, { requestId, input });
  return data.resolveQuoteRequest;
};
export const deleteQuoteApi = async (id) => {
  const query = `
    mutation DeleteQuote($id: ID!) {
      deleteQuote(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.deleteQuote;
};

export const rejectQuoteApi = async (id) => {
  const query = `
    mutation RejectQuote($id: ID!) {
      rejectQuote(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.rejectQuote;
};

export const updateQuoteStatusApi = async (id, status) => {
  const query = `
    mutation UpdateQuoteStatus($id: ID!, $status: String!) {
      updateQuoteStatus(id: $id, status: $status) {
        id
        status
      }
    }
  `;
  const data = await gql(query, { id, status });
  return data.updateQuoteStatus;
};

export const getPendingQuoteRequestsCountApi = async () => {
  const query = `
    query {
      pendingQuoteRequestsCount
    }
  `;
  try {
    const data = await gql(query);
    return data?.pendingQuoteRequestsCount || 0;
  } catch {
    return 0;
  }
};

export const getUnreadQuoteRequestsApi = async () => {
  const query = `
    query {
      unreadQuoteRequests {
        id
        created_at
        status
        notification_read
        contact {
          id
          full_name
        }
        client {
          business_name
        }
      }
    }
  `;
  const data = await gql(query);
  return data.unreadQuoteRequests;
};

export const markQuoteNotificationReadApi = async (id) => {
  const query = `
    mutation($id: ID!) {
      markQuoteNotificationRead(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.markQuoteNotificationRead;
};

export const sendQuoteEmailApi = async ({
  quote_id,
  contact_email,
  message,
  pdf_base64,
}) => {
  const query = `
    mutation SendEmail($quote_id: ID!, $contact_email: String!, $message: String!, $pdf_base64: String) {
      sendQuoteEmail(quote_id: $quote_id, contact_email: $contact_email, message: $message, pdf_base64: $pdf_base64) {
        success
        message
      }
    }
  `;
  const data = await gql(query, { quote_id, contact_email, message, pdf_base64 });
  return data.sendQuoteEmail;
};

export const toggleQuotePortalApi = async (id, access, contact_id) => {
  const query = `
    mutation TogglePortal($id: ID!, $access: Boolean!, $contact_id: ID) {
      toggleQuotePortal(id: $id, access: $access, contact_id: $contact_id)
    }
  `;
  const data = await gql(query, { id, access, contact_id });
  return data.toggleQuotePortal;
};
