import { findProductById } from "../../../repositories/product.repository.js";

export async function getProductAction(id) {
  return findProductById(id);
}

