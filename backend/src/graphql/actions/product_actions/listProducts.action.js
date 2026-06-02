import { listProducts, searchProducts } from "../../../repositories/product.repository.js";

export async function listProductsAction({ client_id, limit, offset } = {}) {
  return listProducts({ client_id, limit, offset });
}

export async function searchProductsAction(q, client_id) {
  return searchProducts(q, client_id);
}

