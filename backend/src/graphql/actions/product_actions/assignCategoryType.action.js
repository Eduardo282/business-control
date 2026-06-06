import {
  normalizeCatalogProductType,
  upsertProductCategoryType,
} from "../../../repositories/product.repository.js";

export async function assignCategoryTypeAction(name, productType) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("El nombre de la categoría no puede estar vacío.");

  return upsertProductCategoryType(safeName, normalizeCatalogProductType(productType));
}
