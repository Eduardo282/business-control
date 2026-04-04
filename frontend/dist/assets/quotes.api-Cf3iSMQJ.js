import{c as s}from"./index-B_2HdQMN.js";const i=async()=>{const e=await s.post("/",{query:`
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
  `});if(e.data.errors)throw new Error(e.data.errors[0].message);return e.data.data.quotes},u=async a=>{const t=await s.post("/",{query:`
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
  `,variables:{id:a}});if(t.data.errors)throw new Error(t.data.errors[0].message);return t.data.data.quote},c=async a=>{const t=await s.post("/",{query:`
    mutation CreateQuote($input: CreateQuoteInput!) {
      createQuote(input: $input) {
        id
        folio
        total
        status
      }
    }
  `,variables:{input:a}});if(t.data.errors)throw new Error(t.data.errors[0].message);return t.data.data.createQuote},d=async(a,e)=>{const r=await s.post("/",{query:`
    mutation ResolveQuoterequest($requestId: ID!, $input: CreateQuoteInput!) {
      resolveQuoteRequest(requestId: $requestId, input: $input) {
        id
        folio
        total
        status
      }
    }
  `,variables:{requestId:a,input:e}});if(r.data.errors)throw new Error(r.data.errors[0].message);return r.data.data.resolveQuoteRequest},l=async()=>{var t,r;return((r=(t=(await s.post("/",{query:`
    query {
      pendingQuoteRequestsCount
    }
  `})).data)==null?void 0:t.data)==null?void 0:r.pendingQuoteRequestsCount)||0},m=async()=>{const e=await s.post("/",{query:`
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
  `});if(e.data.errors)throw new Error(e.data.errors[0].message);return e.data.data.unreadQuoteRequests},q=async a=>{const t=await s.post("/",{query:`
    mutation($id: ID!) {
      markQuoteNotificationRead(id: $id)
    }
  `,variables:{id:a}});if(t.data.errors)throw new Error(t.data.errors[0].message);return t.data.data.markQuoteNotificationRead},p=async({quote_id:a,contact_email:e,message:t})=>{const o=await s.post("/",{query:`
    mutation SendEmail($quote_id: ID!, $contact_email: String!, $message: String!) {
      sendQuoteEmail(quote_id: $quote_id, contact_email: $contact_email, message: $message) {
        success
        message
      }
    }
  `,variables:{quote_id:a,contact_email:e,message:t}});if(o.data.errors)throw new Error(o.data.errors[0].message);return o.data.data.sendQuoteEmail},_=async(a,e,t)=>{const o=await s.post("/",{query:`
    mutation TogglePortal($id: ID!, $access: Boolean!, $contact_id: ID) {
      toggleQuotePortal(id: $id, access: $access, contact_id: $contact_id)
    }
  `,variables:{id:a,access:e,contact_id:t}});if(o.data.errors)throw new Error(o.data.errors[0].message);return o.data.data.toggleQuotePortal};export{l as a,m as b,c,u as g,i as l,q as m,d as r,p as s,_ as t};
