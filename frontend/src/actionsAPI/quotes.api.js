import { axiosClient } from "./axiosClient";

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
      }
    }
  `;
  const res = await axiosClient.post("/", { query });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.quotes;
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
      }
    }
  `;
  const res = await axiosClient.post("/", { query, variables: { client_id } });
  if (res.data.errors?.length) throw new Error(res.data.errors[0].message);
  return res.data.data.quotesByClient;
};
export const getQuoteApi = async (id) => {
  const query = `
    query GetQuote($id: ID!) {
      quote(id: $id) {
        id
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
  const res = await axiosClient.post("/", { query, variables: { id } });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.quote;
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
  const res = await axiosClient.post("/", {
    query,
    variables: { input },
  });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.createQuote;
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
  const res = await axiosClient.post("/", {
    query,
    variables: { requestId, input },
  });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.resolveQuoteRequest;
};
export const deleteQuoteApi = async (id) => {
  const query = `
    mutation DeleteQuote($id: ID!) {
      deleteQuote(id: $id)
    }
  `;
  const res = await axiosClient.post("/", {
    query,
    variables: { id },
  });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.deleteQuote;
};

export const getPendingQuoteRequestsCountApi = async () => {
  const query = `
    query {
      pendingQuoteRequestsCount
    }
  `;
  const res = await axiosClient.post("/", { query });
  // suppress errors for notifications
  return res.data?.data?.pendingQuoteRequestsCount || 0;
};

export const getUnreadQuoteRequestsApi = async () => {
  const query = `
    query {
      unreadQuoteRequests {
        id
        created_at
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
  const res = await axiosClient.post("/", { query });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.unreadQuoteRequests;
};

export const markQuoteNotificationReadApi = async (id) => {
  const query = `
    mutation($id: ID!) {
      markQuoteNotificationRead(id: $id)
    }
  `;
  const res = await axiosClient.post("/", { query, variables: { id } });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.markQuoteNotificationRead;
};

export const sendQuoteEmailApi = async ({
  quote_id,
  contact_email,
  message,
}) => {
  const query = `
    mutation SendEmail($quote_id: ID!, $contact_email: String!, $message: String!) {
      sendQuoteEmail(quote_id: $quote_id, contact_email: $contact_email, message: $message) {
        success
        message
      }
    }
  `;
  const res = await axiosClient.post("/", {
    query,
    variables: { quote_id, contact_email, message },
  });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.sendQuoteEmail;
};

export const toggleQuotePortalApi = async (id, access, contact_id) => {
  const query = `
    mutation TogglePortal($id: ID!, $access: Boolean!, $contact_id: ID) {
      toggleQuotePortal(id: $id, access: $access, contact_id: $contact_id)
    }
  `;
  const res = await axiosClient.post("/", {
    query,
    variables: { id, access, contact_id },
  });
  if (res.data.errors) throw new Error(res.data.errors[0].message);
  return res.data.data.toggleQuotePortal;
};
