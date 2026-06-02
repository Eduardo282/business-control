import { gql } from "../utils/graphqlClient";

export async function listProductsApi(client_id = null) {
  const query = `
    query GetProducts($clientId: ID) {
      products(client_id: $clientId) {
        id name category description
        current_price users_count client_id
        product_type
      }
    }
  `;
  const variables = client_id ? { clientId: client_id } : {};
  const data = await gql(query, variables);
  return data.products;
}

export async function getProductApi(id) {
  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id name category description
        current_price users_count client_id
        product_type
        price_history { id price changed_at }
        client { id business_name rfc email1 }
      }
    }
  `;
  const data = await gql(query, { id });
  return data.product;
}

export async function createProductApi(input) {
  const query = `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id name product_type }
    }
  `;
  const data = await gql(query, { input });
  return data.createProduct;
}

export async function updateProductApi(id, input) {
  const query = `
    mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
      updateProduct(id: $id, input: $input) { id name }
    }
  `;
  const data = await gql(query, { id, input });
  return data.updateProduct;
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
  const data = await gql(query, { id, price: parseFloat(price) });
  return data.updateProductPrice;
}

export async function searchProductsApi(q, client_id = null) {
  const query = `
    query SearchProducts($q: String!, $client_id: ID) {
      searchProducts(q: $q, client_id: $client_id) {
        id name category description
        current_price users_count client_id
        product_type
      }
    }
  `;
  const data = await gql(query, { q, client_id });
  return data.searchProducts;
}

export async function deleteProductApi(id) {
  const query = `mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`;
  const data = await gql(query, { id });
  return data.deleteProduct;
}

export async function clearProductPriceHistoryApi(product_id) {
  const query = `mutation ClearProductPriceHistory($product_id: ID!) { clearProductPriceHistory(product_id: $product_id) }`;
  const data = await gql(query, { product_id });
  return data.clearProductPriceHistory;
}

// ─── Category API ──────────────────────────────────────────────────────────────

export async function listCategoriesApi() {
  const query = `
    query ListProductCategories {
      productCategories { id name }
    }
  `;
  const data = await gql(query);
  return data.productCategories;
}

export async function createCategoryApi(name) {
  const query = `
    mutation CreateCategory($name: String!) {
      createCategory(name: $name) { id name }
    }
  `;
  const data = await gql(query, { name });
  return data.createCategory;
}

export async function deleteCategoryApi(id) {
  const query = `
    mutation DeleteCategory($id: ID!) {
      deleteCategory(id: $id)
    }
  `;
  const data = await gql(query, { id });
  return data.deleteCategory;
}
