import { listProductCategories } from "../../../repositories/product.repository.js";

export async function listCategoriesAction() {
  return await listProductCategories();
}
