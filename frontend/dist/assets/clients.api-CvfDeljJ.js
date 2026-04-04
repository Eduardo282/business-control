import{c as n}from"./index-B_2HdQMN.js";const c="http://localhost:4000/graphql",u=c.replace(/\/graphql\/?$/i,"");function r(a){return`${u}${a}`}async function p(){var e;const a=`
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
  `,{data:i}=await n.post("",{query:a});if((e=i.errors)!=null&&e.length)throw new Error(i.errors[0].message);return i.data.clients}async function m(a){var t;const i=`
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
  `,{data:e}=await n.post("",{query:i,variables:{id:a}});if((t=e.errors)!=null&&t.length)throw new Error(e.errors[0].message);return e.data.client}async function f(a){var s;const i=`
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
  `,{data:e}=await n.post("",{query:i,variables:{client_id:a}});if((s=e.errors)!=null&&s.length)throw new Error(e.errors[0].message);const t=[];return e.data.contactsByClient.forEach(o=>{o.active_services.forEach(l=>{t.push({...l,contact_name:o.full_name})})}),t}async function C(a){var t;const i=`
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
  `,{data:e}=await n.post("",{query:i,variables:{q:a}});if((t=e.errors)!=null&&t.length)throw new Error(e.errors[0].message);return e.data.searchClients}async function h(a){var t;const i=`
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
  `,{data:e}=await n.post("",{query:i,variables:{input:a}});if((t=e.errors)!=null&&t.length)throw new Error(e.errors[0].message);return e.data.createClient}async function _(a,i){var s;const e=`
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
  `,{data:t}=await n.post("",{query:e,variables:{id:a,input:i}});if((s=t.errors)!=null&&s.length)throw new Error(t.errors[0].message);return t.data.updateClient}async function g(a){var t;const i=`
    mutation DeleteClient($id: ID!) {
      deleteClient(id: $id)
    }
  `,{data:e}=await n.post("",{query:i,variables:{id:a}});if((t=e.errors)!=null&&t.length)throw new Error(e.errors[0].message);return e.data.deleteClient}async function y(a){var t;const i=`
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
  `,{data:e}=await n.post("",{query:i,variables:{inputs:a}});if((t=e.errors)!=null&&t.length)throw new Error(e.errors[0].message);return e.data.bulkCreateClients}async function w(){const{data:a}=await n.get(r("/api/clients/dynamic"));return a}async function $(a,i){const{data:e}=await n.put(r(`/api/clients/${a}/dynamic`),i);return e}async function v(a){var i,e;try{const{data:t}=await n.post(r("/api/clients/import-drive"),{fileUrl:a});return t}catch(t){const s=((e=(i=t==null?void 0:t.response)==null?void 0:i.data)==null?void 0:e.message)||(t==null?void 0:t.message)||"No se pudo importar el archivo desde Drive.";throw new Error(s)}}export{$ as a,y as b,h as c,g as d,f as e,p as f,m as g,v as i,w as l,C as s,_ as u};
