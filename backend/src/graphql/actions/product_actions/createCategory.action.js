import { insertProductCategory } from "../../../repositories/product.repository.js";

export async function createCategoryAction(name) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("El nombre de la categoría no puede estar vacío.");

  return insertProductCategory(safeName);
}
