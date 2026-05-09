import{i as n}from"./index-BH9wGhQj.js";const o=n.create({baseURL:"http://localhost:4000/graphql",headers:{"Content-Type":"application/json"}});o.interceptors.request.use(r=>{const t=sessionStorage.getItem("bc_portal_token");return t&&(r.headers.Authorization=`Bearer ${t}`),r});async function u(r,t){var s;const e=`
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
  `,{data:a}=await o.post("",{query:e,variables:{email:r,password:t}});if((s=a.errors)!=null&&s.length)throw new Error(a.errors[0].message);return a.data.loginContact}async function c(r){var a;const t=`
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
    `,{data:e}=await o.post("",{query:t,variables:{id:r}});if((a=e.errors)!=null&&a.length)throw new Error(e.errors[0].message);return e.data.contact}async function l(){var e;const r=`
    query {
      quotes {
        id
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
  `,{data:t}=await o.post("",{query:r});if((e=t.errors)!=null&&e.length)throw new Error(t.errors[0].message);return t.data.quotes}async function d(){var e;const r=`
    query {
      portalProducts {
        id
        name
        category
        description
      }
    }
  `,{data:t}=await o.post("",{query:r});if((e=t.errors)!=null&&e.length)throw new Error(t.errors[0].message);return t.data.portalProducts}async function p(r){var a;const t=`
    mutation RequestQuote($input: RequestQuoteInput!) {
      requestQuote(input: $input) {
        id
        status
      }
    }
  `,{data:e}=await o.post("",{query:t,variables:{input:{items:r}}});if((a=e.errors)!=null&&a.length)throw new Error(e.errors[0].message);return e.data.requestQuote}export{l as a,d as b,c as g,u as l,p as r};
