import{c as o}from"./index-B_2HdQMN.js";const c="http://localhost:4000/graphql",u=c.replace(/\/graphql\/?$/i,"");function i(e){return`${u}${e}`}async function d(e){var a;const n=`
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
  `,{data:t}=await o.post("",{query:n,variables:{input:e}});if((a=t.errors)!=null&&a.length)throw new Error(t.errors[0].message);return t.data.createContact}async function p(e,n){var r;const t=`
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
  `,{data:a}=await o.post("",{query:t,variables:{id:e,input:n}});if((r=a.errors)!=null&&r.length)throw new Error(a.errors[0].message);return a.data.updateContact}async function C(e){var a;const n=`
    mutation DeleteContact($id: ID!) {
      deleteContact(id: $id)
    }
  `,{data:t}=await o.post("",{query:n,variables:{id:e}});if((a=t.errors)!=null&&a.length)throw new Error(t.errors[0].message);return t.data.deleteContact}async function m(e){var a;const n=`
    query ListContactsByClient($client_id: ID!) {
      contactsByClient(client_id: $client_id) {
        id
        full_name
        email
      }
    }
  `,{data:t}=await o.post("",{query:n,variables:{client_id:e}});if((a=t.errors)!=null&&a.length)throw new Error(t.errors[0].message);return t.data.contactsByClient||[]}async function y(e){var a;const n=`
      mutation CreateContactProduct($input: CreateContactProductInput!) {
        createContactProduct(input: $input) {
          id
          license_key
          start_date
          expiration_date
          status
        }
      }
    `,{data:t}=await o.post("",{query:n,variables:{input:e}});if((a=t.errors)!=null&&a.length)throw new Error(t.errors[0].message);return t.data.createContactProduct}async function h(e){var a;const n=`
      mutation DeleteContactProduct($id: ID!) {
        deleteContactProduct(id: $id)
      }
    `,{data:t}=await o.post("",{query:n,variables:{id:e}});if((a=t.errors)!=null&&a.length)throw new Error(t.errors[0].message);return t.data.deleteContactProduct}async function w(e){var a;const n=`
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
  `,{data:t}=await o.post("",{query:n,variables:{inputs:e}});if((a=t.errors)!=null&&a.length)throw new Error(t.errors[0].message);return t.data.bulkCreateContacts}async function f(e){const{data:n}=await o.get(i(`/api/contacts/client/${e}/dynamic`));return n}async function g(e,n){const{data:t}=await o.put(i(`/api/contacts/${e}/dynamic`),n);return t}async function _({fileUrl:e,clientId:n}){var t,a;try{const{data:r}=await o.post(i("/api/contacts/import-drive"),{fileUrl:e,clientId:n});return r}catch(r){const s=((a=(t=r==null?void 0:r.response)==null?void 0:t.data)==null?void 0:a.message)||(r==null?void 0:r.message)||"No se pudo importar el archivo desde Drive.";throw new Error(s)}}export{p as a,w as b,d as c,C as d,y as e,h as f,m as g,_ as i,f as l,g as u};
