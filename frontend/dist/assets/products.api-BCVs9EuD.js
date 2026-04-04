import{c}from"./index-B_2HdQMN.js";async function n(e=null){var i;const a=`
    query GetProducts($clientId: ID) {
      products(client_id: $clientId) {
        id name category description
        current_price users_count client_id
      }
    }
  `,t=e?{clientId:e}:{},{data:r}=await c.post("",{query:a,variables:t});if((i=r.errors)!=null&&i.length)throw new Error(r.errors[0].message);return r.data.products}async function s(e){var r;const a=`
    query GetProduct($id: ID!) {
      product(id: $id) {
        id name category description
        current_price users_count client_id
        price_history { id price changed_at }
        client { id business_name rfc email1 }
      }
    }
  `,{data:t}=await c.post("",{query:a,variables:{id:e}});if((r=t.errors)!=null&&r.length)throw new Error(t.errors[0].message);return t.data.product}async function d(e){var r;const a=`
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id name }
    }
  `,{data:t}=await c.post("",{query:a,variables:{input:e}});if((r=t.errors)!=null&&r.length)throw new Error(t.errors[0].message);return t.data.createProduct}async function u(e,a){var i;const t=`
    mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
      updateProduct(id: $id, input: $input) { id name }
    }
  `,{data:r}=await c.post("",{query:t,variables:{id:e,input:a}});if((i=r.errors)!=null&&i.length)throw new Error(r.errors[0].message);return r.data.updateProduct}async function p(e,a){var i;const t=`
    mutation UpdateProductPrice($id: ID!, $price: Float!) {
      updateProductPrice(id: $id, price: $price) {
        id current_price
        price_history { id price changed_at }
      }
    }
  `,{data:r}=await c.post("",{query:t,variables:{id:e,price:parseFloat(a)}});if((i=r.errors)!=null&&i.length)throw new Error(r.errors[0].message);return r.data.updateProductPrice}async function l(e,a=null){var i;const t=`
    query SearchProducts($q: String!, $client_id: ID) {
      searchProducts(q: $q, client_id: $client_id) {
        id name category description
        current_price users_count client_id
      }
    }
  `,{data:r}=await c.post("",{query:t,variables:{q:e,client_id:a}});if((i=r.errors)!=null&&i.length)throw new Error(r.errors[0].message);return r.data.searchProducts}async function P(e){var r;const a="mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }",{data:t}=await c.post("",{query:a,variables:{id:e}});if((r=t.errors)!=null&&r.length)throw new Error(t.errors[0].message);return t.data.deleteProduct}export{p as a,d as c,P as d,s as g,n as l,l as s,u};
