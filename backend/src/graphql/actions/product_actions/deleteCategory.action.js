import { deleteProductCategory } from "../../../repositories/product.repository.js";

export async function deleteCategoryAction(id) {
  const affected = await deleteProductCategory(id);
  return affected > 0;
}
