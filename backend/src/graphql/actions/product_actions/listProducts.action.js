import { listProducts, searchProducts } from "../../../repositories/product.repository.js";

export async function listProductsAction({ client_id } = {}) {
  return listProducts({ client_id });
}

export async function searchProductsAction(q, client_id) {
  return searchProducts(q, client_id);
}

