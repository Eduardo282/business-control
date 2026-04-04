import { axiosClient } from "./axiosClient.js";

export async function listProductsApi(client_id = null) {
  const query = `
    query GetProducts($clientId: ID) {
      products(client_id: $clientId) {
        id name category description
        current_price users_count client_id
      }
    }
  `;
  const variables = client_id ? { clientId: client_id } : {};
  const { data } = await axiosClient.post("", { query, variables });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.products;
}

export async function getProductApi(id) {
  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id name category description
        current_price users_count client_id
        price_history { id price changed_at }
        client { id business_name rfc email1 }
      }
    }
  `;
  const { data } = await axiosClient.post("", { query, variables: { id } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.product;
}

export async function createProductApi(input) {
  const query = `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id name }
    }
  `;
  const { data } = await axiosClient.post("", { query, variables: { input } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.createProduct;
}

export async function updateProductApi(id, input) {
  const query = `
    mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
      updateProduct(id: $id, input: $input) { id name }
    }
  `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { id, input },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.updateProduct;
}

export async function updateProductPriceApi(id, price) {
  const query = `
    mutation UpdateProductPrice($id: ID!, $price: Float!) {
      updateProductPrice(id: $id, price: $price) {
        id current_price
        price_history { id price changed_at }
      }
    }
  `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { id, price: parseFloat(price) },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.updateProductPrice;
}

export async function searchProductsApi(q, client_id = null) {
  const query = `
    query SearchProducts($q: String!, $client_id: ID) {
      searchProducts(q: $q, client_id: $client_id) {
        id name category description
        current_price users_count client_id
      }
    }
  `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { q, client_id },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.searchProducts;
}

export async function deleteProductApi(id) {
  const query = `mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`;
  const { data } = await axiosClient.post("", { query, variables: { id } });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.deleteProduct;
}

export async function clearProductPriceHistoryApi(product_id) {
  const query = `mutation ClearProductPriceHistory($product_id: ID!) { clearProductPriceHistory(product_id: $product_id) }`;
  const { data } = await axiosClient.post("", {
    query,
    variables: { product_id },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.clearProductPriceHistory;
}
